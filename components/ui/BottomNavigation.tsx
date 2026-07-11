'use client';

import { usePathname } from 'next/navigation';
import { Home, AlertTriangle, MapPin, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/',         label: 'Home',     icon: <Home className="w-6 h-6" /> },
  { href: '/plan',     label: 'My Plan',  icon: <Shield className="w-6 h-6" /> },
  { href: '/alerts',   label: 'Alerts',   icon: <AlertTriangle className="w-6 h-6" /> },
  { href: '/shelters', label: 'Shelters', icon: <MapPin className="w-6 h-6" /> },
  { href: '/settings', label: 'Settings', icon: <User className="w-6 h-6" /> },
];

export function BottomNavigation() {
  const pathname = usePathname();

  // Strip locale prefix so /en/alerts matches /alerts
  const segments = pathname.split('/').filter(Boolean);
  // If first segment is likely a locale (2 character code), strip it
  const localePath = segments.length >= 1 && segments[0].length === 2
    ? '/' + segments.slice(1).join('/')
    : pathname;
  const cleanPath = localePath || '/';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom bg-white/95 backdrop-blur-md border-t border-cloud-200"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? cleanPath === '/' || cleanPath === ''
              : cleanPath.startsWith(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200',
                'touch-manipulation min-h-[56px]',
                isActive
                  ? 'text-storm-700 bg-storm-50'
                  : 'text-cloud-400 hover:text-storm-700 hover:bg-cloud-50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={cn('relative transition-transform', isActive && 'scale-110')} aria-hidden="true">
                {item.icon}
              </span>
              <span className={cn('text-xs font-medium leading-none', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}