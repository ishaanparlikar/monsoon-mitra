'use client';

import { forwardRef, useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, X, Search, Check } from 'lucide-react';
import { Portal } from './Portal';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  clearable?: boolean;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  maxHeight?: number;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      placeholder = 'Select an option',
      label,
      error,
      helperText,
      searchable = false,
      clearable = false,
      fullWidth = true,
      onChange,
      maxHeight = 200,
      id,
      disabled,
      required,
      ...props
    },
    _ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const selectRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(
      () => options.find((opt) => opt.value === props.value),
      [options, props.value]
    );

    const filteredOptions = useMemo(() => {
      if (!searchable || !searchQuery) return options;
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchable, searchQuery]);

    const handleSelect = (value: string) => {
      onChange?.(value);
      setIsOpen(false);
      setSearchQuery('');
      inputRef.current?.blur();
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
      setSearchQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        selectRef.current?.focus();
      }
      if (e.key === 'Enter' && searchable) {
        const firstOption = filteredOptions[0];
        if (firstOption && !firstOption.disabled) {
          handleSelect(firstOption.value);
        }
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText && !error ? `${selectId}-helper` : undefined;

    const dropdownContent = (
      <div
        className="absolute z-50 w-full mt-1.5 bg-background dark:bg-surface-elevated rounded-xl border border-border shadow-lg max-h-[200px] overflow-auto"
        style={{ maxHeight: maxHeight }}
        role="listbox"
        aria-label={label || 'Select options'}
      >
        {searchable && (
          <div className="p-2 border-b border-border sticky top-0 bg-background dark:bg-surface-elevated z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted"
                autoFocus
              />
            </div>
          </div>
        )}
        {filteredOptions.length === 0 && (
          <div className="p-3 text-center text-sm text-muted">
            {searchable ? 'No options found' : 'No options available'}
          </div>
        )}
        {filteredOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !option.disabled && handleSelect(option.value)}
            disabled={option.disabled}
            className={cn(
              'w-full px-3 py-2.5 text-left text-sm transition-colors',
              'hover:bg-surface focus:bg-surface',
              'first:rounded-t-xl last:rounded-b-xl',
              selectedOption?.value === option.value
                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                : 'text-foreground',
              option.disabled && 'text-muted cursor-not-allowed'
            )}
            role="option"
            aria-selected={selectedOption?.value === option.value}
            aria-disabled={option.disabled}
          >
            <div className="flex items-center gap-2">
              {option.icon && <span className="flex-shrink-0 w-5 h-5">{option.icon}</span>}
              <span className="flex-1 truncate">{option.label}</span>
              {selectedOption?.value === option.value && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
              )}
            </div>
          </button>
        ))}
      </div>
    );

    return (
      <div className={cn('w-full', fullWidth && 'sm:max-w-xs')}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground mb-1.5 dark:text-foreground"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div
          ref={selectRef}
          tabIndex={0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(errorId, helperId)}
          aria-disabled={disabled}
          aria-required={required}
          className="relative"
        >
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 text-left',
              'rounded-xl border bg-background',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed',
              'min-h-[48px]',
              'flex items-center justify-between gap-3',
              error && 'border-danger focus:ring-danger',
              !error && 'border-border hover:border-border-strong',
              className
            )}
          >
            <span className={cn('flex-1 truncate', selectedOption ? 'text-foreground' : 'text-muted')}>
              {selectedOption?.label || placeholder}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {clearable && selectedOption && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted" aria-hidden="true" />
              )}
            </div>
          </button>

          {isOpen && (
            <Portal>
              <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsOpen(false)} />
              <div style={{ position: 'fixed', zIndex: 50 }}>
                {dropdownContent}
              </div>
            </Portal>
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

Select.displayName = 'Select';
