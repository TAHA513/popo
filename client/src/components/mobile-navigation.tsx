import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Video, Users, Settings, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileNavigation() {
  const [location] = useLocation();

  const navItems = [
    {
      label: 'الرئيسية',
      href: '/',
      icon: Home,
      active: location === '/'
    },
    {
      label: 'البث',
      href: '/start-stream',
      icon: PlusCircle,
      active: location === '/start-stream'
    },
    {
      label: 'المتابعون',
      href: '/following',
      icon: Users,
      active: location === '/following'
    },
    {
      label: 'الإعدادات',
      href: '/settings',
      icon: Settings,
      active: location === '/settings'
    }
  ];

  return (
    <nav className="mobile-nav">
      <div className="flex justify-around items-center py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors touch-target",
                  item.active
                    ? "text-laa-pink bg-laa-pink/10"
                    : "text-gray-600 dark:text-gray-400 hover:text-laa-pink hover:bg-laa-pink/5"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}