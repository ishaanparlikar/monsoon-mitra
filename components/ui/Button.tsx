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
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary shadow-sm',
      secondary: 'bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success shadow-sm',
      outline: 'border-2 border-primary text-primary hover:bg-primary/10 focus-visible:ring-primary',
      ghost: 'text-foreground hover:bg-surface focus-visible:ring-primary',
      destructive: 'bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger shadow-sm',
      warning: 'bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning shadow-sm',
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
