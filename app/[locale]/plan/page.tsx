'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Home, FileText, Package, MapPin, HeartPulse, MessageSquare, Shield, RefreshCw } from 'lucide-react';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const categoryConfig: Record<string, { icon: any; label: string }> = {
  home_prep: { icon: Home, label: 'Home Prep' },
  documents: { icon: FileText, label: 'Documents' },
  emergency_kit: { icon: Package, label: 'Emergency Kit' },
  evacuation: { icon: MapPin, label: 'Evacuation' },
  health: { icon: HeartPulse, label: 'Health' },
  communication: { icon: MessageSquare, label: 'Communication' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  low: { color: 'bg-green-100 text-green-800', label: 'Low' },
};

const mockChecklist = [
  { itemId: 'pre_001', title: 'Elevate electrical sockets & appliances', category: 'home_prep', priority: 'critical' as const, description: 'Raise sockets to 1.5m above floor level to prevent electrocution', is_completed: false },
  { itemId: 'pre_002', title: 'Clear roof drains, balconies & surroundings', category: 'home_prep', priority: 'high' as const, description: 'Remove debris to prevent waterlogging', is_completed: true },
  { itemId: 'pre_003', title: 'Waterproof doors & windows', category: 'home_prep', priority: 'medium' as const, description: 'Seal gaps with weather stripping', is_completed: false },
  { itemId: 'pre_004', title: 'Check structural integrity of walls/roof', category: 'home_prep', priority: 'high' as const, description: 'Repair cracks before monsoon', is_completed: false },
  { itemId: 'pre_005', title: 'Store documents in waterproof bags', category: 'documents', priority: 'critical' as const, description: 'Protect identity, property, medical records', is_completed: false },
  { itemId: 'pre_006', title: 'Digitize important documents', category: 'documents', priority: 'high' as const, description: 'Scan and save to cloud storage', is_completed: true },
  { itemId: 'pre_007', title: 'Assemble emergency kit (water, food, torch, radio, first aid)', category: 'emergency_kit', priority: 'critical' as const, description: '72-hour survival essentials', is_completed: false },
  { itemId: 'pre_008', title: 'Pack go-bag for vulnerable members (meds, 3-day supply)', category: 'health', priority: 'high' as const, description: 'Medicines, special dietary needs, comfort items', is_completed: false },
  { itemId: 'pre_009', title: 'Identify nearest shelter & evacuation route', category: 'evacuation', priority: 'critical' as const, description: 'Know evacuation path before disaster strikes', is_completed: false },
  { itemId: 'pre_010', title: 'Practice evacuation drill with family', category: 'evacuation', priority: 'medium' as const, description: 'Ensure everyone knows the route', is_completed: false },
  { itemId: 'pre_011', title: 'Save emergency contacts offline', category: 'communication', priority: 'high' as const, description: 'Ward office, shelter, ambulance 108, disaster helpline 1077', is_completed: true },
  { itemId: 'pre_012', title: 'Install weather alert app with notifications', category: 'communication', priority: 'medium' as const, description: 'IMD, NDMA official apps', is_completed: false },
  { itemId: 'pre_013', title: 'Review home/health insurance coverage', category: 'documents', priority: 'medium' as const, description: 'Ensure flood damage is covered', is_completed: false },
  { itemId: 'pre_014', title: 'Stock up on prescription medicines (30 days)', category: 'health', priority: 'high' as const, description: 'For chronic conditions', is_completed: false },
  { itemId: 'pre_015', title: 'Prepare pet/livestock evacuation plan', category: 'health', priority: 'low' as const, description: 'Carriers, food, medications for animals', is_completed: false },
];

const mockPlan = {
  summary: 'Your family of 4 in Andheri West has a monsoon risk score of 72/100. Prioritize evacuation prep and emergency kit.',
  riskScore: 72,
  riskFactors: ['Low-lying flood-prone area', 'Elderly family member(s) need assistance', 'Young children require special care', 'Emergency kit incomplete'],
  phaseGuidance: {
    pre_monsoon: 'Complete all critical items before June 1. Focus on home hardening and kit assembly.',
    active_monsoon: 'Monitor alerts daily. Keep go-bags by door. Evacuate immediately on "warning" level alert.',
    post_monsoon: 'Document damage for claims. Boil water. Watch for dengue/malaria symptoms.',
  },
};

const phaseLabels = {
  pre_monsoon: 'Pre-Monsoon (Apr–May)',
  active_monsoon: 'Active Monsoon (Jun–Sep)',
  post_monsoon: 'Post-Monsoon (Oct–Nov)',
};

export default function PlanPage() {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [phase, setPhase] = useState<'pre_monsoon' | 'active_monsoon' | 'post_monsoon'>('pre_monsoon');

  const categories = Array.from(new Set(mockChecklist.map(item => item.category)));

  return (
    <div className="min-h-screen bg-slate-50 pb-32 safe-area-insets">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold text-slate-900 text-lg">My Preparedness Plan</h1>
          </div>
        </div>

        {/* Phase Selector */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {(['pre_monsoon', 'active_monsoon', 'post_monsoon'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                phase === p
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              aria-pressed={phase === p}
            >
              {phaseLabels[p]}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6 pb-28">
        {/* Risk Score */}
        <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-lg">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-primary-100 text-sm font-medium">Monsoon Risk Score</p>
                <p className="text-4xl font-bold mt-1">{mockPlan.riskScore}</p>
                <p className="text-primary-200 text-sm mt-1">High Risk - Action Required</p>
              </div>
              <div className="w-20 h-20 rounded-full border-4 border-primary-300 border-t-white flex items-center justify-center">
                <span className="text-2xl font-bold">{mockPlan.riskScore}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {mockPlan.riskFactors.map((factor, i) => (
                <Badge key={i} variant="default" className="border-slate-300 text-slate-700 bg-slate-100">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Phase Guidance */}
        <Card>
          <div className="p-4">
            <h2 className="font-semibold text-slate-900 mb-2">{phaseLabels[phase]} Guidance</h2>
            <p className="text-slate-600 text-sm">{mockPlan.phaseGuidance[phase]}</p>
          </div>
        </Card>

        {/* Checklist */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
            <Button variant="ghost" size="sm" onClick={() => {}}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4" role="tablist">
            <button
              onClick={() => setFilter('all')}
              role="tab"
              aria-selected={filter === 'all'}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                role="tab"
                aria-selected={filter === cat}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filter === cat ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {categoryConfig[cat]?.label || cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {categories.map(category => {
              const items = mockChecklist.filter(item => item.category === category && (filter === 'all' || filter === category));
              if (items.length === 0) return null;

              const completed = items.filter(i => i.is_completed).length;
              const total = items.length;
              const CategoryIcon = categoryConfig[category]?.icon;

              return (
                <Card key={category} className="overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === category ? null : category)}
                    className="w-full p-4 flex items-center justify-between bg-slate-50 border-b border-slate-100"
                    aria-expanded={expanded === category}
                  >
                    <div className="flex items-center gap-3">
                      {CategoryIcon && <CategoryIcon className="w-5 h-5 text-slate-500" aria-hidden="true" />}
                      <span className="font-medium text-slate-900 capitalize">{categoryConfig[category]?.label || category}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${completed === total ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${(completed / total) * 100}%` }} />
                      </div>
                      {expanded === category ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  {expanded === category && (
                    <div className="divide-y divide-slate-100">
                      {items.map(item => {
                        const ItemCategoryIcon = categoryConfig[item.category]?.icon;
                        return (
                          <div key={item.itemId} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                            <button
                              onClick={() => {}}
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-colors ${item.is_completed ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-primary-400'}`}
                              aria-label={item.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                              aria-pressed={item.is_completed}
                            >
                              {item.is_completed && <Check className="w-4 h-4 text-white" aria-hidden="true" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium text-slate-900 ${item.is_completed ? 'line-through text-slate-400' : ''}`}>
                                  {item.title}
                                </h4>
                                <Badge variant={item.priority as any}>{priorityConfig[item.priority]?.label}</Badge>
                              </div>

                              {item.description && (
                                <p className={`text-sm ${item.is_completed ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {item.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  {ItemCategoryIcon && <ItemCategoryIcon className="w-3 h-3" />}
                                  {categoryConfig[item.category]?.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}