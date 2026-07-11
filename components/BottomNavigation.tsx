'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, FileText, Bell, MapPin, Settings, User, Shield } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, label: 'Home' },
  { name: 'My Plan', href: '/plan', icon: FileText, label: 'Plan' },
  { name: 'Alerts', href: '/alerts', icon: Bell, label: 'Alerts' },
  { name: 'Shelters', href: '/shelters', icon: MapPin, label: 'Shelters' },
  { name: 'Settings', href: '/settings', icon: Settings, label: 'Settings' },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50" role="navigation" aria-label="Main navigation">
        <div className="flex justify-around h-16" />
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50" role="navigation" aria-label="Main navigation">
      <div className="flex justify-around h-16 items-center">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-1.5 min-w-[60px] touch-target',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 hover:text-gray-600 active:text-gray-900'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className={cn('w-6 h-6', isActive && 'fill-current')} aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNavigationSkeleton() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50" role="navigation" aria-label="Main navigation">
      <div className="flex justify-around h-16 items-center">
        {navigation.map((item) => (
          <div key={item.name} className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 min-w-[60px]" />
        ))}
      </div>
    </nav>
  );
}