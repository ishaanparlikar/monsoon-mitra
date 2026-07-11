'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Users, Home, Building, School, Navigation } from 'lucide-react';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import type { ShelterWithDistance } from '@/types';

export interface SheltersUIProps {
  familyId: string | null;
}

const typeIcon: Record<string, React.ReactNode> = {
  'Community Hall': <Home className="w-4 h-4" />,
  'Government': <Building className="w-4 h-4" />,
  'School': <School className="w-4 h-4" />,
  'NDMA Camp': <Navigation className="w-4 h-4" />,
};

function amenityColors(amenity: string) {
  const map: Record<string, string> = {
    Water: 'bg-water-100 text-water-700',
    Food: 'bg-safe-100 text-safe-700',
    Medical: 'bg-danger-100 text-danger-700',
    Toilets: 'bg-cloud-100 text-cloud-700',
    'Special Needs': 'bg-mumbai-caution-100 text-mumbai-caution-700',
  };
  return map[amenity] || 'bg-cloud-100 text-cloud-700';
}

function getShelterType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('school') || lower.includes('college') || lower.includes('high')) return 'School';
  if (lower.includes('camp') || lower.includes('ndma')) return 'NDMA Camp';
  if (lower.includes('bmc') || lower.includes('ward') || lower.includes('municipal') || lower.includes('government')) return 'Government';
  return 'Community Hall';
}

function getAmenitiesList(facilities: unknown): string[] {
  if (!facilities) return ['Water', 'Food'];
  const fac = (typeof facilities === 'string' ? JSON.parse(facilities) : facilities) as Record<string, unknown>;
  const list: string[] = [];
  if (fac.water) list.push('Water');
  if (fac.food) list.push('Food');
  if (fac.medical) list.push('Medical');
  if (fac.toilets) list.push('Toilets');
  if (fac.special_needs || fac.wheelchair_accessible) list.push('Special Needs');
  if (list.length === 0) return ['Water', 'Food'];
  return list;
}

export function SheltersUI({ familyId }: SheltersUIProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [shelters, setShelters] = useState<ShelterWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/family/${familyId}/shelters`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setShelters(data.data);
        } else {
          setError(data.error?.message || 'Failed to load shelters');
        }
      })
      .catch((err) => {
        console.error('Error fetching shelters:', err);
        setError('Network error loading shelters');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [familyId]);

  return (
    <div className="min-h-screen bg-paper-dry pb-32 safe-all">
      <header className="sticky top-0 z-40 bg-paper-dry border-b border-cloud-200 shadow-cloud-shadow safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-water-600 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-storm-900 text-lg leading-none">Nearby Shelters</h1>
              <p className="text-xs text-cloud-500 mt-0.5">
                {loading ? 'Locating shelters...' : `${shelters.length} locations active`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3 pb-28">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-water-50 border border-water-200 rounded-2xl p-3">
          <Navigation className="w-4 h-4 text-water-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-water-800">
            These are pre-designated emergency shelters maintained by authorities for active monsoons. Please check capacity and directions before travelling.
          </p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-cloud-200 animate-pulse">
                <CardContent className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cloud-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-cloud-100 rounded w-2/3" />
                    <div className="h-3 bg-cloud-100 rounded w-1/2" />
                    <div className="h-3 bg-cloud-100 rounded w-1/3 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <p className="text-sm text-danger-600 mb-2">{error}</p>
            <Button size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {!loading && !error && shelters.length === 0 && (
          <div className="text-center py-10 bg-cloud-50 border border-dashed border-cloud-200 rounded-2xl px-4">
            <MapPin className="w-8 h-8 text-cloud-300 mx-auto mb-2" />
            <p className="text-sm text-storm-600 font-medium">No shelters found nearby</p>
            <p className="text-xs text-cloud-500 mt-1">If your family location is not set, we cannot locate nearby shelters.</p>
          </div>
        )}

        {!loading && !error && shelters.map(shelter => {
          const isSelected = selected === shelter.id;
          const shelterType = getShelterType(shelter.name);
          const amenities = getAmenitiesList(shelter.facilities);
          const distanceStr = shelter.distanceKm !== null && shelter.distanceKm !== undefined
            ? `${shelter.distanceKm} km`
            : 'Near you';
          const phone = '1078'; // fallback helpline

          return (
            <Card
              key={shelter.id}
              className={`overflow-hidden transition-all duration-200 cursor-pointer ${isSelected ? 'border-water-400 shadow-medium' : 'border-cloud-200'}`}
              onClick={() => setSelected(isSelected ? null : shelter.id)}
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-water-100 text-water-600' : 'bg-cloud-100 text-cloud-600'}`}>
                        {typeIcon[shelterType] || <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-storm-900 text-sm leading-snug">{shelter.name}</h3>
                        <p className="text-xs text-cloud-500 mt-0.5 line-clamp-1">{shelter.address}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-water-600 font-medium">{distanceStr}</span>
                          <span className="text-cloud-300">·</span>
                          <span className="text-xs text-cloud-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Cap. {shelter.capacity} ({shelter.current_occupancy} occupied)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={shelter.is_active ? "success" : "destructive"} className="text-[10px] flex-shrink-0">
                      {shelter.is_active ? 'Open' : 'Closed'}
                    </Badge>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {amenities.map(a => (
                      <span key={a} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${amenityColors(a)}`}>{a}</span>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t border-cloud-100 p-4 bg-cloud-50 space-y-3 animate-in">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs"
                        leftIcon={<Navigation className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}`, '_blank');
                        }}
                      >
                        Get Directions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        leftIcon={<Phone className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${phone}`;
                        }}
                      >
                        Call Help
                      </Button>
                    </div>
                    <p className="text-xs text-cloud-500">
                      Tap "Get Directions" to open Google Maps with step-by-step route directions from your location.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Emergency note */}
        <Card className="border-danger-200 bg-danger-50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-danger-700 mb-1">Immediate Emergency?</p>
            <p className="text-xs text-danger-600 mb-3">Call NDMA Helpline before travelling to a shelter to confirm availability.</p>
            <a href="tel:1078">
              <Button variant="destructive" size="sm" fullWidth leftIcon={<Phone className="w-4 h-4" />}>
                Call 1078 — NDMA Helpline
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
