'use client';

import { useState } from 'react';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertTriangle, AlertCircle, Info, Shield, Trash2, Edit2, Home, Package, MapPin, HeartPulse, MessageSquare } from 'lucide-react';
import { Badge, PriorityBadge } from './Badge';

export type ChecklistItemCategory =
  | 'home_prep'
  | 'documents'
  | 'emergency_kit'
  | 'evacuation'
  | 'health'
  | 'communication'
  | 'other';

export type ChecklistItemPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ChecklistItemData {
  id: string;
  plan_id: string;
  item_text: string;
  item_text_localized?: string | null;
  priority: ChecklistItemPriority;
  category: ChecklistItemCategory;
  phase_applicability: ('pre_monsoon' | 'active_monsoon' | 'post_monsoon')[];
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  localized_text?: string;
}

export interface ChecklistItemProps {
  item: ChecklistItemData;
  onToggle: (id: string, completed: boolean) => void;
  onEdit?: (item: ChecklistItemData) => void;
  onDelete?: (id: string) => void;
  showSwipeActions?: boolean;
  showCategory?: boolean;
  language?: string;
}

const categoryConfig: Record<ChecklistItemCategory, { icon: ReactNode; label: string }> = {
  home_prep: { icon: <Home className="w-4 h-4" aria-hidden="true" />, label: 'Home Preparation' },
  documents: { icon: <Shield className="w-4 h-4" aria-hidden="true" />, label: 'Documents & Insurance' },
  emergency_kit: { icon: <Package className="w-4 h-4" aria-hidden="true" />, label: 'Emergency Kit' },
  evacuation: { icon: <MapPin className="w-4 h-4" aria-hidden="true" />, label: 'Evacuation Planning' },
  health: { icon: <HeartPulse className="w-4 h-4" aria-hidden="true" />, label: 'Health & Medical' },
  communication: { icon: <MessageSquare className="w-4 h-4" aria-hidden="true" />, label: 'Communication' },
  other: { icon: <Info className="w-4 h-4" aria-hidden="true" />, label: 'Other' },
};

const priorityIcons = {
  critical: <AlertTriangle className="w-4 h-4 text-danger-500 dark:text-danger-400" aria-hidden="true" />,
  high: <AlertCircle className="w-4 h-4 text-warning-500 dark:text-warning-400" aria-hidden="true" />,
  medium: <Info className="w-4 h-4 text-info-500 dark:text-info-400" aria-hidden="true" />,
  low: <Shield className="w-4 h-4 text-success-500 dark:text-success-400" aria-hidden="true" />,
};

export const ChecklistItem = forwardRef<HTMLDivElement, ChecklistItemProps>(
  (
    {
      item,
      onToggle,
      onEdit,
      onDelete,
      showSwipeActions = true,
      showCategory = true,
      language = 'en',
    },
    ref
  ) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [showActions, setShowActions] = useState(false);

    const category = categoryConfig[item.category] || categoryConfig.other;
    const displayText = language !== 'en' && item.item_text_localized ? item.item_text_localized : item.item_text;

    const handleTouchStart = (_e: React.TouchEvent) => {
      setSwipeOffset(0);
      setShowActions(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!showSwipeActions) return;
      const deltaX = e.touches[0].clientX - (e.touches[0] as unknown as { startX: number }).startX;
      if (deltaX < 0) {
        setSwipeOffset(Math.max(deltaX, -120));
      }
    };

    const handleTouchEnd = () => {
      if (swipeOffset < -60) {
        setShowActions(true);
        setSwipeOffset(-120);
      } else {
        setSwipeOffset(0);
        setShowActions(false);
      }
    };

    const handleToggle = () => {
      if (showActions) {
        setShowActions(false);
        setSwipeOffset(0);
        return;
      }
      onToggle(item.id, !item.is_completed);
    };

    const handleEdit = () => {
      setShowActions(false);
      setSwipeOffset(0);
      onEdit?.(item);
    };

    const handleDelete = () => {
      setShowActions(false);
      setSwipeOffset(0);
      onDelete?.(item.id);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative bg-background border-b border-border',
          'transition-transform duration-200 ease-out',
          item.is_completed && 'bg-success-50/50 dark:bg-success-900/20',
          showActions && 'translate-x-[-120px]'
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <label
          className="flex items-start gap-3 p-4 cursor-pointer hover:bg-surface transition-colors"
          onClick={handleToggle}
        >
          <input
            type="checkbox"
            checked={item.is_completed}
            onChange={(e) => {
              e.stopPropagation();
              if (!showActions) onToggle(item.id, !item.is_completed);
            }}
            className="w-5 h-5 mt-0.5 text-primary border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={displayText}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <PriorityBadge priority={item.priority} size="sm" />
              {showCategory && (
                <Badge variant="default" size="sm">
                  {category.icon}
                  <span className="ml-1">{category.label}</span>
                </Badge>
              )}
              {item.phase_applicability && item.phase_applicability.length > 0 && (
                <Badge variant="info" size="sm">
                  {item.phase_applicability.map((p) => p.replace('_', ' ')).join(', ')}
                </Badge>
              )}
            </div>
            <p
              className={cn(
                'text-foreground',
                item.is_completed ? 'line-through text-muted' : ''
              )}
            >
              {displayText}
            </p>
            {item.localized_text && language !== 'en' && (
              <p className="text-sm text-muted mt-1">{item.item_text}</p>
            )}
          </div>
          {item.is_completed && (
            <Check className="w-6 h-6 text-success-500 dark:text-success-400 flex-shrink-0" aria-hidden="true" />
          )}
          {!item.is_completed && (
            <div className="flex-shrink-0" aria-hidden="true">
              {priorityIcons[item.priority]}
            </div>
          )}
        </label>

        {showSwipeActions && !item.is_completed && (
          <div
            className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4"
            role="menu"
            aria-label="Item actions"
          >
            <button
              onClick={handleEdit}
              className="p-2 rounded-lg bg-info-100 text-info-700 hover:bg-info-200 transition-colors dark:bg-info-900/40 dark:text-info-300"
              role="menuitem"
              aria-label="Edit item"
            >
              <Edit2 className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-danger-100 text-danger-700 hover:bg-danger-200 transition-colors dark:bg-danger-900/40 dark:text-danger-300"
              role="menuitem"
              aria-label="Delete item"
            >
              <Trash2 className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {showActions && (
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => {
              setShowActions(false);
              setSwipeOffset(0);
            }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

ChecklistItem.displayName = 'ChecklistItem';

export interface ChecklistItemSkeletonProps {
  count?: number;
}

export function ChecklistItemSkeleton({ count = 3 }: ChecklistItemSkeletonProps) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading checklist items">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-3 p-4">
            <div className="w-5 h-5 rounded bg-surface dark:bg-ctp-mocha-surface1" aria-hidden="true" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 bg-surface dark:bg-ctp-mocha-surface1 rounded" aria-hidden="true" />
              <div className="h-4 w-3/4 bg-surface dark:bg-ctp-mocha-surface1 rounded" aria-hidden="true" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
