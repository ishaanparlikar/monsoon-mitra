import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const shelterId = searchParams.get('shelterId');

  const supabase = createServerClient() as any;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Fetch family
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();

  if (!family) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Family not found' } },
      { status: 404 }
    );
  }

  // Check access
  const isPrimaryMember = family.primary_member === session.user.id;
  const { data: member } = await supabase
    .from('family_members')
    .select('profile_id')
    .eq('family_id', familyId)
    .eq('profile_id', session.user.id)
    .single();

  if (!isPrimaryMember && !member) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  // Fetch evacuation routes from this family's location
  // Note: routes are matched by rounded coordinates for approximate matching
  if (!family.lat || !family.lng) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Family location not set' } },
      { status: 422 }
    );
  }

  // Use a bounding box approach to find nearby routes
  // Routes stored for approximate from_lat/from_lng
  const latRounded = Math.round(family.lat * 100) / 100;
  const lngRounded = Math.round(family.lng * 100) / 100;

  let routesQuery = supabase
    .from('evacuation_routes')
    .select(`
      *,
      shelter:shelters(id, name, address, lat, lng, capacity, current_occupancy, facilities)
    `)
    .gte('from_lat', latRounded - 0.02)
    .lte('from_lat', latRounded + 0.02)
    .gte('from_lng', lngRounded - 0.02)
    .lte('from_lng', lngRounded + 0.02);

  if (shelterId) {
    routesQuery = routesQuery.eq('to_shelter_id', shelterId);
  }

  const { data: routes, error: routesError } = await routesQuery;

  if (routesError) {
    console.error('Routes fetch error:', routesError);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch routes' } },
      { status: 500 }
    );
  }

  // Enrich with passability info
  const enrichedRoutes = (routes || []).map((route: any) => {
    const isCurrentlyPassable = route.road_condition !== 'blocked';
    return {
      ...route,
      waypoints: route.waypoints || [],
      isCurrentlyPassable,
      shelter: route.shelter ? {
        id: route.shelter.id,
        name: route.shelter.name,
        address: route.shelter.address,
        lat: route.shelter.lat,
        lng: route.shelter.lng,
        capacity: route.shelter.capacity,
        currentOccupancy: route.shelter.current_occupancy,
      } : null,
    };
  });

  return NextResponse.json({
    success: true,
    data: enrichedRoutes,
    meta: {
      timestamp: new Date().toISOString(),
      familyLocation: { lat: family.lat, lng: family.lng },
    },
  });
}