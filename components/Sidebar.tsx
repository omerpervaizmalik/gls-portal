"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Files, 
  Users, 
  History, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Wifi,
  Wallet,
  Scale,
  ClipboardList,
  Menu,
  X,
  User,
  Database
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isNative } from '@/lib/platform';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',         href: '/' },
  { icon: ClipboardList,   label: 'Task Manager',      href: '/tasks' },
  { icon: Files,           label: 'File Archive',       href: '/files' },
  { icon: Users,           label: 'Client Accounts',    href: '/clients' },
  { icon: Scale,           label: 'Tax Filing Record', href: '/tax-filings' },
  { icon: ClipboardList,   label: 'Doc Requirements',  href: '/requirements' },
  { icon: Files,           label: 'Quotations',        href: '/fams/quote' },
  { icon: User,            label: 'My Profile',        href: '/profile' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileApp, setIsMobileApp] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    setIsMobileApp(isNative());
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobileApp) {
    return null;
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-corporate-primary text-white rounded-lg shadow-lg hover:bg-slate-800 transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-72 h-full bg-corporate-primary text-slate-300 flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out print:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center space-x-3 mb-10 mt-2 lg:mt-0">
            <img src="/logo.jpeg" alt="GLS" className="h-10 w-auto object-contain drop-shadow-md" />
            <div className="flex flex-col min-w-0 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
              <span className="text-xl font-bold text-white tracking-tight leading-none whitespace-nowrap lg:whitespace-normal">GLS</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1 whitespace-nowrap lg:whitespace-normal">Management Portal</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Main Menu</p>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                className="group flex items-center px-4 py-3 text-sm font-semibold rounded-xl hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50"
              >
                <div className="w-8 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <span className="ml-2">{item.label}</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            ))}

            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-slate-800/50">
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Administration</p>
                <Link
                  href="/fams"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className="group flex items-center px-4 py-3 text-sm font-semibold rounded-xl hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50"
                >
                  <div className="w-8 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="ml-2">Financial Accounts</span>
                  <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
                <Link
                  href="/iris"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className="group flex items-center px-4 py-3 text-sm font-semibold rounded-xl hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50"
                >
                  <div className="w-8 flex items-center justify-center">
                    <Wifi className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="ml-2">IRIS Integration</span>
                  <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
                <Link
                  href="/logs"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className="group flex items-center px-4 py-3 text-sm font-semibold rounded-xl hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50"
                >
                  <div className="w-8 flex items-center justify-center">
                    <History className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="ml-2">Activity Logs</span>
                  <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className="group flex items-center px-4 py-3 text-sm font-semibold rounded-xl bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all duration-200 mt-2 border border-amber-500/10"
                >
                  <div className="w-8 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="ml-2">Access Management</span>
                </Link>
                <Link
                  href="/admin/backup"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className="group flex items-center px-4 py-3 text-sm font-semibold rounded-xl hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50 mt-1"
                >
                  <div className="w-8 flex items-center justify-center">
                    <Database className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="ml-2">Backup & Restore</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/30">
          <Link 
            href="/profile"
            className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-2xl mb-4 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : '??'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight group-hover:text-amber-400 transition-colors">{session?.user?.name || 'User'}</p>
              <div className="flex items-center mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shrink-0"></span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{session?.user?.role || 'CLIENT'}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
          </Link>


          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center justify-center space-x-2 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
