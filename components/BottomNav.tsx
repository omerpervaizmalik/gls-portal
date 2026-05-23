"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  User,
  Files
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isNative } from '@/lib/platform';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/' },
  { icon: ClipboardList, label: 'Docs', href: '/requirements' },
  { icon: ClipboardList, label: 'Tasks', href: '/tasks' },
  { icon: Users, label: 'Clients', href: '/clients' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    setActive(isNative());
  }, []);

  if (!active) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50 lg:hidden pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-amber-600" : "text-slate-400"
            )}
          >
            <item.icon size={20} className={isActive ? "fill-amber-600/10" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            {isActive && (
              <div className="absolute bottom-0 w-8 h-1 bg-amber-600 rounded-t-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
