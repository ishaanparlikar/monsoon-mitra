'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Globe, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Portal } from './Portal';
import { Button } from './Button';

export type LanguageCode = 'en' | 'hi' | 'mr' | 'gu' | 'bn' | 'ta' | 'te' | 'kn' | 'ml' | 'or' | 'pa' | 'as';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
];

export interface LanguageSelectorProps {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  label?: string;
  fullWidth?: boolean;
  showNativeName?: boolean;
  className?: string;
  disabled?: boolean;
  trigger?: 'select' | 'button' | 'bottom-sheet';
}

export function LanguageSelector({
  value,
  onChange,
  label = 'Language',
  fullWidth = true,
  showNativeName = true,
  className,
  disabled = false,
  trigger = 'button',
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === value) || SUPPORTED_LANGUAGES[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const enabled = filteredLanguages;
    const currentIndex = enabled.findIndex((l) => l.code === value);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = Math.min(currentIndex + 1, enabled.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) handleSelect(enabled[currentIndex].code);
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }

    if (nextIndex >= 0 && nextIndex < enabled.length) {
      listRef.current?.querySelector(`[data-index="${nextIndex}"]`)?.scrollIntoView({ block: 'nearest' });
    }
  };

  const dropdownContent = (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      className="fixed z-50 w-full max-w-sm mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-fade-in"
      style={{ maxHeight: 320 }}
    >
      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search languages..."
          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          aria-label="Search languages"
          autoFocus
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {filteredLanguages.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500">No languages found</div>
      ) : (
        <div className="max-h-[280px] overflow-y-auto">
          {filteredLanguages.map((lang, index) => (
            <button
              key={lang.code}
              data-index={index}
              role="option"
              aria-selected={lang.code === value}
              onClick={() => handleSelect(lang.code)}
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                'w-full px-4 py-3 text-left flex items-center gap-3',
                'hover:bg-gray-50 transition-colors',
                'focus:outline-none focus:bg-gray-50',
                lang.code === value && 'bg-primary-50 text-primary-700'
              )}
            >
              <span className="text-lg" aria-hidden="true">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-medium">{lang.name}</span>
                {showNativeName && lang.nativeName !== lang.name && (
                  <span className="block text-sm text-gray-500 truncate">{lang.nativeName}</span>
                )}
              </div>
              {lang.code === value && <Check className="w-5 h-5 text-primary-600 flex-shrink-0" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (trigger === 'select') {
    return (
      <div className={cn('w-full', fullWidth && 'sm:max-w-xs', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as LanguageCode)}
          disabled={disabled}
          className={cn(
            'w-full min-h-[48px] px-4 py-3',
            'rounded-xl border bg-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'appearance-none bg-no-repeat bg-right-3 bg-center',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")]',
            'pr-10',
            disabled ? 'border-gray-200' : 'border-gray-300 hover:border-gray-400',
            className
          )}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name} {showNativeName && lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (trigger === 'bottom-sheet') {
    return (
      <Button
        ref={triggerRef}
        variant="outline"
        fullWidth={fullWidth}
        leftIcon={<Globe className="w-5 h-5" aria-hidden="true" />}
        rightIcon={isOpen ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${selectedLanguage.name}`}
        className={className}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{selectedLanguage.flag}</span>
          <span className="flex-1 text-left truncate font-medium">{selectedLanguage.name}</span>
        </span>
      </Button>
    );
  }

  return (
    <div className={cn('relative', fullWidth && 'w-full', className)}>
      <Button
        ref={triggerRef}
        variant="outline"
        fullWidth={fullWidth}
        leftIcon={<Globe className="w-5 h-5" aria-hidden="true" />}
        rightIcon={isOpen ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${selectedLanguage.name}`}
        onKeyDown={handleKeyDown}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{selectedLanguage.flag}</span>
          <span className="flex-1 text-left truncate font-medium">{selectedLanguage.name}</span>
        </span>
      </Button>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsOpen(false)} />
          <div className="fixed z-50" style={{ position: 'fixed', zIndex: 50 }}>
            {dropdownContent}
          </div>
        </Portal>
      )}
    </div>
  );
}