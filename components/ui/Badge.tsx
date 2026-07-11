'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Home, FileText, Package, MapPin, HeartPulse, MessageSquare } from 'lucide-react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'completed' | 'info' | 'warning' | 'success' | 'destructive' | 'secondary';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface text-foreground border-border dark:bg-ctp-mocha-surface1 dark:text-ctp-mocha-text dark:border-ctp-mocha-surface0',
      critical: 'bg-danger-100 text-danger-700 border-danger-200 dark:bg-danger-900/40 dark:text-danger-300 dark:border-danger-800/50',
      high: 'bg-warning-100 text-warning-700 border-warning-200 dark:bg-warning-900/40 dark:text-warning-300 dark:border-warning-800/50',
      medium: 'bg-info-100 text-info-700 border-info-200 dark:bg-info-900/40 dark:text-info-300 dark:border-info-800/50',
      low: 'bg-success-100 text-success-700 border-success-200 dark:bg-success-900/40 dark:text-success-300 dark:border-success-800/50',
      completed: 'bg-success-100 text-success-700 border-success-200 dark:bg-success-900/40 dark:text-success-300 dark:border-success-800/50',
      info: 'bg-info-100 text-info-700 border-info-200 dark:bg-info-900/40 dark:text-info-300 dark:border-info-800/50',
      warning: 'bg-warning-100 text-warning-700 border-warning-200 dark:bg-warning-900/40 dark:text-warning-300 dark:border-warning-800/50',
      success: 'bg-success-100 text-success-700 border-success-200 dark:bg-success-900/40 dark:text-success-300 dark:border-success-800/50',
      destructive: 'bg-danger-100 text-danger-700 border-danger-200 dark:bg-danger-900/40 dark:text-danger-300 dark:border-danger-800/50',
      secondary: 'bg-success-100 text-success-700 border-success-200 dark:bg-success-900/40 dark:text-success-300 dark:border-success-800/50',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    const dotColors = {
      default: 'bg-surface dark:bg-ctp-mocha-surface1',
      critical: 'bg-danger-500',
      high: 'bg-warning-500',
      medium: 'bg-info-500',
      low: 'bg-success-500',
      completed: 'bg-success-500',
      info: 'bg-info-500',
      warning: 'bg-warning-500',
      success: 'bg-success-500',
      destructive: 'bg-danger-500',
      secondary: 'bg-success-500',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1',
          'font-medium rounded-full border',
          'transition-colors duration-200',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              dotColors[variant]
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function PriorityBadge({ priority, size = 'md', showLabel = true }: PriorityBadgeProps) {
  const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <Badge variant={priority} size={size} dot>
      {showLabel && labels[priority]}
    </Badge>
  );
}

export interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable' | 'overdue';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    pending: { variant: 'medium' as const, label: 'Pending', dot: true },
    in_progress: { variant: 'info' as const, label: 'In Progress', dot: true },
    completed: { variant: 'completed' as const, label: 'Completed', dot: true },
    not_applicable: { variant: 'default' as const, label: 'N/A', dot: false },
    overdue: { variant: 'critical' as const, label: 'Overdue', dot: true },
  };

  const { variant, label, dot } = config[status];

  return <Badge variant={variant} size={size} dot={dot}>{label}</Badge>;
}

export interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

const categoryIcons: Record<string, React.ReactNode> = {
  home_prep: <Home className="w-3 h-3" aria-hidden="true" />,
  documents: <FileText className="w-3 h-3" aria-hidden="true" />,
  emergency_kit: <Package className="w-3 h-3" aria-hidden="true" />,
  evacuation: <MapPin className="w-3 h-3" aria-hidden="true" />,
  health: <HeartPulse className="w-3 h-3" aria-hidden="true" />,
  communication: <MessageSquare className="w-3 h-3" aria-hidden="true" />,
};

const categoryLabels: Record<string, string> = {
  home_prep: 'Home Prep',
  documents: 'Documents',
  emergency_kit: 'Emergency Kit',
  evacuation: 'Evacuation',
  health: 'Health',
  communication: 'Communication',
};

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const Icon = categoryIcons[category];
  const label = categoryLabels[category] || category;

  return (
    <Badge variant="default" size={size}>
      {Icon}
      <span className="capitalize">{label.replace('_', ' ')}</span>
    </Badge>
  );
}
