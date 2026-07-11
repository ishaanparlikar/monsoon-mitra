'use client';

import { forwardRef, HTMLAttributes, useState } from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'warning' | 'danger' | 'success';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; iconBg: string; darkContainer: string; darkIcon: string; darkIconBg: string }> = {
  info: {
    container: 'bg-ctp-sky/10 border-ctp-sky/30 text-ctp-sapphire',
    icon: 'text-ctp-sapphire',
    iconBg: 'bg-ctp-sky/20',
    darkContainer: 'dark:bg-ctp-sky/20 dark:border-ctp-sky/50 dark:text-ctp-sky',
    darkIcon: 'dark:text-ctp-sky',
    darkIconBg: 'dark:bg-ctp-sky/30',
  },
  warning: {
    container: 'bg-ctp-yellow/10 border-ctp-yellow/30 text-ctp-peach',
    icon: 'text-ctp-yellow',
    iconBg: 'bg-ctp-yellow/20',
    darkContainer: 'dark:bg-ctp-yellow/20 dark:border-ctp-yellow/50 dark:text-ctp-yellow',
    darkIcon: 'dark:text-ctp-yellow',
    darkIconBg: 'dark:bg-ctp-yellow/30',
  },
  danger: {
    container: 'bg-ctp-red/10 border-ctp-red/30 text-ctp-red',
    icon: 'text-ctp-red',
    iconBg: 'bg-ctp-red/20',
    darkContainer: 'dark:bg-ctp-red/20 dark:border-ctp-red/50 dark:text-ctp-red',
    darkIcon: 'dark:text-ctp-red',
    darkIconBg: 'dark:bg-ctp-red/30',
  },
  success: {
    container: 'bg-ctp-green/10 border-ctp-green/30 text-ctp-green',
    icon: 'text-ctp-green',
    iconBg: 'bg-ctp-green/20',
    darkContainer: 'dark:bg-ctp-green/20 dark:border-ctp-green/50 dark:text-ctp-green',
    darkIcon: 'dark:text-ctp-green',
    darkIconBg: 'dark:bg-ctp-green/30',
  },
};

const variantIcons: Record<AlertVariant, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle,
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      title,
      description,
      icon,
      dismissible = false,
      onDismiss,
      action,
      expandable = false,
      defaultExpanded = false,
      children,
      ...props
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const styles = variantStyles[variant];
    const Icon = variantIcons[variant];

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    const handleExpand = () => {
      if (expandable) {
        setExpanded(!expanded);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border p-4 flex gap-3',
          styles.container,
          styles.darkContainer,
          className
        )}
        role="alert"
        aria-live={variant === 'danger' ? 'assertive' : 'polite'}
        {...props}
      >
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            styles.iconBg,
            styles.icon,
            styles.darkIconBg,
            styles.darkIcon
          )}
          aria-hidden="true"
        >
          {icon || <Icon className="w-5 h-5" aria-hidden="true" />}
        </div>

        <div className="flex-1 min-w-0">
          {(title || description) && (
            <div className="flex items-start gap-2">
              <div className="flex-1">
                {title && (
                  <h4 className="font-semibold text-base text-foreground dark:text-foreground">{title}</h4>
                )}
                {description && (
                  <p className="text-sm mt-0.5 text-muted dark:text-muted">{description}</p>
                )}
              </div>
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className={cn(
                    'flex-shrink-0 p-1 rounded-lg hover:bg-surface transition-colors',
                    styles.icon,
                    styles.darkIcon
                  )}
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {children && <div className="mt-2">{children}</div>}

          {expandable && (
            <button
              onClick={handleExpand}
              className={cn(
                'mt-2 flex items-center gap-1 text-sm font-medium transition-colors',
                styles.icon,
                styles.darkIcon
              )}
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Show less' : 'Show more'}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {expanded && action && (
            <div className="mt-3">{action}</div>
          )}
        </div>
      </div>
    )
  }
);

Alert.displayName = 'Alert';

export interface InlineAlertProps extends Omit<AlertProps, 'dismissible' | 'onDismiss'> {
  dismissible?: true;
  onDismiss?: () => void;
}

export const InlineAlert = forwardRef<HTMLDivElement, InlineAlertProps>(
  ({ className, dismissible = true, onDismiss, ...props }, ref) => {
    return (
      <Alert
        ref={ref}
        dismissible={dismissible}
        onDismiss={onDismiss}
        className={cn('animate-slide-down', className)}
        {...props}
      />
    )
  }
);

InlineAlert.displayName = 'InlineAlert';
