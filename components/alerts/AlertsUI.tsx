'use client';

import { AlertTriangle, AlertCircle, Info, Clock, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const severityConfig = {
  warning: {
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    icon: AlertTriangle,
    label: 'RED ALERT',
    iconColor: 'text-danger-500',
    badgeVariant: 'critical' as const,
  },
  alert: {
    bg: 'bg-mumbai-caution-50',
    border: 'border-mumbai-caution-200',
    icon: AlertCircle,
    label: 'ORANGE ALERT',
    iconColor: 'text-mumbai-caution-500',
    badgeVariant: 'warning' as const,
  },
  watch: {
    bg: 'bg-water-50',
    border: 'border-water-200',
    icon: Info,
    label: 'YELLOW WATCH',
    iconColor: 'text-water-500',
    badgeVariant: 'info' as const,
  },
};

interface AlertsUIProps {
  alerts: any[];
}

export function AlertsUI({ alerts }: AlertsUIProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (alerts.length === 0) {
    return (
      <Card variant="shelter" className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-safe-100 flex items-center justify-center mx-auto mb-3">
          <Info className="w-6 h-6 text-safe-500" aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-storm-800 mb-1">No Active Alerts</h3>
        <p className="text-sm text-cloud-600">No weather alerts for your district at this time.</p>
      </Card>
    );
  }

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  if (visibleAlerts.length === 0) {
    return (
      <Card variant="elevated" className="text-center py-6">
        <p className="text-sm text-cloud-600">All alerts dismissed. Pull to refresh.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {visibleAlerts.map(alert => {
        const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.watch;
        const Icon = config.icon;

        return (
          <Card
            key={alert.id}
            variant="elevated"
            className={`${config.bg} ${config.border} border transition-all duration-300 relative overflow-hidden`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-50" style={{ backgroundColor: config.iconColor }} />

            <button
              onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
              className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4 text-cloud-500" />
            </button>

            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <Icon className={`w-8 h-8 ${config.iconColor}`} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={config.badgeVariant} className="text-[10px] tracking-widest font-bold leading-tight">
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-storm-800 leading-relaxed mb-2">
                    <strong className="text-storm-900 font-medium">{alert.title}</strong>{' '}
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-center bg-white/40 hover:bg-white/60 transition duration-200 rounded-full py-1.5 px-4 w-[110px]">
                    <span className="text-xs font-medium text-storm-700">View Details</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                    <div>
                      <h4 className="font-medium text-storm-800 mb-1.5 text-sm uppercase tracking-wider">Official Instruction</h4>
                      <p className="text-sm text-cloud-600 leading-relaxed">{alert.instruction}</p>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cloud-500" />
                        <span className="text-xs text-cloud-600">Affected: {alert.districts?.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-cloud-500" />
                        <span className="text-xs text-cloud-600">Valid until {new Date(alert.valid_until).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
