import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { generateSheltersFromAI } from '@/lib/genai';
import type { Shelter } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Fetch family to get location
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

  // Fetch all active shelters (public read per RLS)
  let shelters: Shelter[] | null = null;
  const { data: fetchedShelters, error: sheltersError } = await supabase
    .from('shelters')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (sheltersError) {
    console.error('Shelters fetch error:', sheltersError);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch shelters' } },
      { status: 500 }
    );
  }
  shelters = fetchedShelters;

  // If no shelters exist in the database, generate them dynamically via AI
  if (!shelters || shelters.length === 0) {
    console.log('No shelters found in database. Generating shelters via AI...');
    try {
      const generated = await generateSheltersFromAI({
        district: family.district || 'Mumbai Suburban',
        ward: family.ward || undefined,
        lat: family.lat || 19.119,
        lng: family.lng || 72.846,
      });

      if (generated && generated.length > 0) {
        // Insert into database using admin client (bypassing user RLS insert restriction)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adminSupabase = createAdminClient() as any;
        const { data: insertedShelters, error: insertError } = await adminSupabase
          .from('shelters')
          .insert(generated)
          .select();

        if (insertError) {
          console.error('Failed to insert AI-generated shelters to database:', insertError);
          // Fallback to returned generated shelters if insert failed
          shelters = generated.map((s, idx) => ({
            id: `temp-ai-${idx}`,
            name: s.name,
            address: s.address,
            lat: s.lat,
            lng: s.lng,
            district: s.district,
            ward: s.ward,
            capacity: s.capacity,
            current_occupancy: s.current_occupancy,
            facilities: s.facilities,
            managing_authority: s.managing_authority,
            is_active: s.is_active,
          }));
        } else {
          shelters = insertedShelters;
        }
      }
    } catch (aiError) {
      console.error('Error generating AI shelters in API route:', aiError);
    }
  }

  // Calculate distances and available capacity for each shelter
  const sheltersWithDistance = (shelters || []).map((shelter: Shelter) => {
    let distanceKm = null;
    if (family.lat && family.lng) {
      // Haversine distance approximation
      const R = 6371; // Earth radius in km
      const dLat = ((shelter.lat - family.lat) * Math.PI) / 180;
      const dLng = ((shelter.lng - family.lng) * Math.PI) / 180;
      const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((family.lat * Math.PI) / 180) *
          Math.cos((shelter.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Math.round(R * c * 10) / 10;
    }

    const availableCapacity = shelter.capacity
      ? shelter.capacity - shelter.current_occupancy
      : null;
    const occupancyPercentage =
      shelter.capacity && shelter.capacity > 0
        ? Math.round((shelter.current_occupancy / shelter.capacity) * 100)
        : 0;

    return {
      ...shelter,
      distanceKm,
      availableCapacity,
      occupancyPercentage,
      isNearCapacity: occupancyPercentage >= 80,
    };
  });

  // Sort by distance if available
  if (family.lat && family.lng) {
    sheltersWithDistance.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  }

  return NextResponse.json({
    success: true,
    data: sheltersWithDistance,
    meta: {
      timestamp: new Date().toISOString(),
      familyLocation: family.lat && family.lng
        ? { lat: family.lat, lng: family.lng }
        : null,
    },
  });
}