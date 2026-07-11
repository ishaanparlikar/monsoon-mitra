'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Globe, X, Loader2 } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      fullWidth = true,
      loading = false,
      id,
      disabled,
      required,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;

    return (
      <div className={cn('w-full', fullWidth && 'sm:max-w-xs')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5 dark:text-foreground"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {(leftIcon || leftElement) && (
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted"
              aria-hidden="true"
            >
              {leftElement || leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled || loading}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(errorId, helperId)}
            aria-busy={loading}
            className={cn(
              'w-full rounded-xl border bg-background text-foreground placeholder:text-muted',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed',
              'min-h-[48px]',
              leftIcon || leftElement ? 'pl-10' : 'pl-4',
              rightIcon || rightElement || loading ? 'pr-10' : 'pr-4',
              'py-3',
              'text-base',
              error && 'border-danger focus:ring-danger',
              !error && 'border-border hover:border-border-strong',
              className
            )}
            {...props}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="w-5 h-5 text-muted animate-spin" aria-hidden="true" />
            </div>
          )}
          {(rightIcon || rightElement) && !loading && (
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted"
              aria-hidden="true"
            >
              {rightElement || rightIcon}
            </div>
          )}
          {error && !loading && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const input = document.getElementById(inputId) as HTMLInputElement;
                input?.value;
                input?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
              aria-label="Clear input"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  countries?: { code: string; name: string; dialCode: string; flag: string }[];
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      countryCode = '+91',
      onCountryCodeChange,
      countries,
      label,
      error,
      helperText,
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    const defaultCountries = [
      { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
      { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
      { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
      { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
      { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
    ];

    const countryList = countries || defaultCountries;
    const currentCountry = countryList.find((c) => c.dialCode === countryCode) || countryList[0];

    return (
      <div className={cn('w-full', fullWidth && 'sm:max-w-xs')}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5 dark:text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Globe className="w-5 h-5 mr-1" aria-hidden="true" />
          </div>
          <select
            className="absolute left-0 top-0 h-full pl-8 pr-8 py-3 bg-transparent border-none focus:outline-none focus:ring-0 appearance-none cursor-pointer text-foreground font-medium text-base z-10 dark:text-foreground"
            value={currentCountry.dialCode}
            onChange={(e) => onCountryCodeChange?.(e.target.value)}
            aria-label="Country code"
          >
            {countryList.map((c) => (
              <option key={c.code} value={c.dialCode}>
                {c.flag} {c.dialCode}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-0 w-20 border-r border-border" aria-hidden="true" />
          <input
            ref={ref}
            type="tel"
            className={cn(
              'w-full rounded-xl border bg-background text-foreground placeholder:text-muted',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'pl-20 pr-4 py-3',
              'min-h-[48px]',
              'text-base',
              error && 'border-danger focus:ring-danger',
              !error && 'border-border hover:border-border-strong',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  minHeight?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = true,
      minHeight = 100,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText && !error ? `${textareaId}-helper` : undefined;

    return (
      <div className={cn('w-full', fullWidth && 'sm:max-w-md')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1.5 dark:text-foreground"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(errorId, helperId)}
          style={{ minHeight: minHeight }}
          className={cn(
            'w-full rounded-xl border bg-background text-foreground placeholder:text-muted',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed',
            'p-4',
            'text-base',
            'resize-y',
            error && 'border-danger focus:ring-danger',
            !error && 'border-border hover:border-border-strong',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
