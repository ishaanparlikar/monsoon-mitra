'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';

interface ChecklistItem {
  id: string;
  item_text: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  is_completed: boolean;
}

interface ChecklistProps {
  items: ChecklistItem[];
}

export function Checklist({ items }: ChecklistProps) {
  if (!items || items.length === 0) return null;

  const completedCount = items.filter(i => i.is_completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const displayItems = items.slice(0, 8);

  return (
    <Card variant="elevated" className="relative overflow-hidden">
      {/* Water channel effect - subtle wave pattern at top */}
      <div className="absolute top-0 left-0 right-0 h-8 opacity-5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 400 32" preserveAspectRatio="none">
          <path d="M0 16 Q100 8 200 16 T400 16 L400 32 L0 32 Z" fill="rgb(168, 216, 255, 0.15)" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <h2 className="text-xs font-bold text-cloud-600 tracking-widest uppercase">
          My Preparedness Checklist
        </h2>
        <span className="text-xs text-storm-600">{completedCount}/{totalCount} complete</span>
      </div>

      {/* Rain-channel Progress */}
      <div className="mb-6 relative">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-cloud-600">We're getting ready</span>
          <span className="text-sm font-semibold text-water-600">{progress}%</span>
        </div>
        <div className="rain-channel">
          <div
            className="rain-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3 relative">
        {displayItems.map(item => (
          <ChecklistItemRow key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}

function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  let statusText = 'Pending';
  let statusColor = 'text-mumbai-caution-600';

  if (item.is_completed) {
    statusText = 'Done';
    statusColor = 'text-safe-600';
  } else if (item.priority === 'critical') {
    statusText = 'Urgent';
    statusColor = 'text-danger-500';
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={item.is_completed}
          readOnly
          className="peer sr-only"
        />
        {/* Custom checkbox - drain grate style */}
        <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all duration-200 pointer-events-none
          ${item.is_completed
            ? 'bg-safe-500/20 border-safe-500'
            : item.priority === 'critical'
              ? 'bg-danger-500/10 border-danger-500'
              : 'bg-cloud-100 border-cloud-300'}`}
        >
          {item.is_completed && (
            <CheckCircle className="w-3.5 h-3.5 text-safe-600" strokeWidth={2.5} />
          )}
          {!item.is_completed && item.priority === 'critical' && (
            <AlertCircle className="w-4 h-4 text-danger-500" strokeWidth={2} />
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
        <p className={`text-sm truncate transition-colors duration-200
          ${item.is_completed ? 'text-cloud-500 line-through' : 'text-storm-800 group-hover:text-storm-900'}`}
        >
          {item.item_text}
        </p>
        <span className={`text-[11px] font-medium ml-2 ${statusColor} whitespace-nowrap`}>
          {statusText}
        </span>
      </div>
    </label>
  );
}