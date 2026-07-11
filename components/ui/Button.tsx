'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';

    const variants = {
      primary: 'bg-storm-700 text-white hover:bg-storm-800 focus-visible:ring-storm-500 shadow-sm dark:bg-storm-600 dark:hover:bg-storm-500',
      secondary: 'bg-safe-500 text-white hover:bg-safe-600 focus-visible:ring-safe-500 shadow-sm',
      outline: 'border-2 border-storm-700 text-storm-700 hover:bg-storm-50 focus-visible:ring-storm-500 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-storm-800',
      ghost: 'text-storm-600 hover:bg-storm-50 focus-visible:ring-storm-500 dark:text-cloud-200 dark:hover:bg-storm-800',
      destructive: 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500 shadow-sm',
      warning: 'bg-caution-500 text-white hover:bg-caution-600 focus-visible:ring-caution-500 shadow-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[40px]',
      md: 'px-4 py-2.5 text-base gap-2 min-h-[48px]',
      lg: 'px-6 py-3.5 text-lg gap-2.5 min-h-[56px]',
      xl: 'px-8 py-4.5 text-xl gap-3 min-h-[64px]',
    };

    const fullWidthStyles = fullWidth ? 'w-full sm:w-auto' : '';

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidthStyles, className)}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';