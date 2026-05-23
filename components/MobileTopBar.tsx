"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/tasks':       'Task Manager',
  '/files':       'File Archive',
  '/clients':     'Client Accounts',
  '/tax-filings': 'Tax Filings',
  '/profile':     'My Profile',
  '/fams':        'Financial Accounts',
  '/iris':        'IRIS Integration',
  '/logs':        'Activity Logs',
  '/admin/users': 'Access Management',
};

export default function MobileTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'GLS Portal';

  return (
    <div style={{
      position: 'relative', zIndex: 100, flexShrink: 0,
      background: 'linear-gradient(180deg, #0f172a 0%, #0f172aee 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(245,158,11,0.15)',
      padding: '48px 16px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        style={{
          width: 38, height: 38,
          borderRadius: 12,
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <ArrowLeft size={18} color="#f59e0b" />
      </button>

      {/* Title */}
      <div style={{ flex: 1 }}>
        <div style={{
          color: '#f1f5f9',
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          {title}
        </div>
        <div style={{ color: '#475569', fontSize: 10, fontWeight: 600, marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Get Legal Solution
        </div>
      </div>

      {/* Home shortcut */}
      <button
        onClick={() => router.push('/')}
        style={{
          width: 38, height: 38,
          borderRadius: 12,
          background: 'rgba(30,58,138,0.3)',
          border: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Home size={17} color="#60a5fa" />
      </button>
    </div>
  );
}
