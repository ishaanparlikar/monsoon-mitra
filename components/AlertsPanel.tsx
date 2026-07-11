'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Clock, MapPin, Droplet } from 'lucide-react';
import { useApp } from './AppContext';
import { Card } from './ui/Card';

const severityConfig = {
  warning: {
    bg: 'bg-storm-800/90',
    border: 'border-storm-700',
    icon: AlertTriangle,
    label: 'HIGH RISK | RED ALERT!',
    iconColor: 'text-danger-500',
  },
  alert: {
    bg: 'bg-mumbai-caution-900/20',
    border: 'border-mumbai-caution-600',
    icon: AlertCircle,
    label: 'ALERT',
    iconColor: 'text-mumbai-caution-500',
  },
  watch: {
    bg: 'bg-water-800/20',
    border: 'border-water-600',
    icon: Info,
    label: 'WATCH',
    iconColor: 'text-water-500',
  },
};

export function AlertsPanel() {
  const { alerts } = useApp();

  if (alerts.length === 0) {
    return (
      <Card variant="shelter" className="text-center py-8">
        <Droplet className="w-12 h-12 text-safe-500 mx-auto mb-3 opacity-90" aria-hidden="true" />
        <h3 className="font-semibold text-storm-800 mb-1">No Active Alerts</h3>
        <p className="text-sm text-cloud-600">No weather alerts for your district at this time.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.watch;
  const Icon = config.icon;

  return (
    <Card
      variant="elevated"
      className={`${config.bg} ${config.border} border transition-all duration-300 relative overflow-hidden`}
    >
      {/* Water surface highlight effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/20"></div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 text-left p-2 -m-2"
        aria-expanded={expanded}
      >
        <div className="mt-1 flex-shrink-0 relative">
          <Icon className={`w-8 h-8 ${config.iconColor}`} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1 mb-2">
            <span className={`text-[10px] tracking-widest font-bold ${config.iconColor} leading-tight`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-storm-800 leading-relaxed max-w-[95%]">
            <strong className="text-storm-900 font-medium">{alert.title}</strong>{' '}
            {alert.description}
          </p>
          <div className="mt-3 flex items-center justify-center bg-white/40 hover:bg-white/60 transition duration-200 rounded-full py-1.5 px-4 w-[110px]">
             <span className="text-xs font-medium text-storm-700">View Details</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/20 space-y-4 animate-in">
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
      )}
    </Card>
  );
}