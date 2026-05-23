"use client";

import React from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, Files, Users, History, LogOut,
  ShieldCheck, Wifi, Wallet, Scale, ClipboardList, User,
  ChevronRight,
} from 'lucide-react';

const mainItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/stats',       grad: '#1e3a8a,#1d4ed8', accent: '#3b82f6' },
  { icon: ClipboardList,   label: 'Doc Requirements', href: '/requirements', grad: '#78350f,#b45309', accent: '#f59e0b' },
  { icon: ClipboardList,   label: 'Task Manager', href: '/tasks',       grad: '#5b21b6,#7c3aed', accent: '#8b5cf6' },
  { icon: Files,           label: 'File Archive', href: '/files',       grad: '#92400e,#d97706', accent: '#f59e0b' },
  { icon: Users,           label: 'Clients',      href: '/clients',     grad: '#065f46,#059669', accent: '#10b981' },
  { icon: Scale,           label: 'Tax Filings',  href: '/tax-filings', grad: '#9f1239,#e11d48', accent: '#f43f5e' },
  { icon: User,            label: 'My Profile',   href: '/profile',     grad: '#1e293b,#334155', accent: '#94a3b8' },
];

const adminItems = [
  { icon: Wallet,     label: 'Accounts',    href: '/fams',        grad: '#78350f,#b45309', accent: '#f59e0b' },
  { icon: Wifi,       label: 'IRIS System', href: '/iris',        grad: '#164e63,#0e7490', accent: '#22d3ee' },
  { icon: History,    label: 'Activity',    href: '/logs',        grad: '#312e81,#4338ca', accent: '#818cf8' },
  { icon: ShieldCheck,label: 'Access',      href: '/admin/users', grad: '#7f1d1d,#dc2626', accent: '#f87171' },
];

interface IconCardProps {
  icon: React.ElementType;
  label: string;
  href: string;
  grad: string;
  accent: string;
  small?: boolean;
}

function IconCard({ icon: Icon, label, href, grad, accent, small }: IconCardProps) {
  const [from, to] = grad.split(',');
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: `linear-gradient(135deg, ${from}ee, ${to}ee)`,
        border: `1px solid ${accent}33`,
        borderRadius: small ? 16 : 20,
        padding: small ? '14px 10px' : '22px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: small ? 8 : 12,
        cursor: 'pointer',
        boxShadow: `0 4px 20px ${accent}22, 0 1px 4px rgba(0,0,0,0.3)`,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        minHeight: small ? 90 : 110,
        position: 'relative',
        overflow: 'hidden',
      }}
        onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.95)')}
        onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 70, height: 70, borderRadius: '50%',
          background: accent, opacity: 0.15, filter: 'blur(20px)',
        }} />

        {/* Icon circle */}
        <div style={{
          width: small ? 44 : 54, height: small ? 44 : 54, borderRadius: '50%',
          background: `${accent}22`,
          border: `1.5px solid ${accent}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${accent}44`,
        }}>
          <Icon size={small ? 20 : 24} color={accent} />
        </div>

        <span style={{
          color: '#f1f5f9',
          fontSize: small ? 10 : 11,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.02em',
          lineHeight: 1.3,
          textTransform: 'uppercase',
          paddingInline: 4,
        }}>
          {label}
        </span>
      </div>
    </Link>
  );
}

export default function MobileHomeScreen() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const name = session?.user?.name || 'User';
  const initials = name.substring(0, 2).toUpperCase();
  const role = session?.user?.role || 'CLIENT';

  return (
    <div style={{
      height: '100%',
      minHeight: '100%',
      background: 'linear-gradient(160deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '52px 20px 24px',
        background: 'linear-gradient(180deg, #0f1e3d 0%, transparent 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
      }}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <img src="/logo.jpeg" alt="GLS" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: 16, letterSpacing: '0.05em' }}>GLS</div>
            <div style={{ color: '#64748b', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Management Portal</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14,
                boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
              }}>
                {initials}
              </div>
            </Link>
          </div>
        </div>

        {/* Welcome */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Welcome back,</div>
          <div style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {name.split(' ')[0]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{role}</span>
          </div>
        </div>

        {/* Search and Notifications row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1, height: 44, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', padding: '0 12px', color: '#94a3b8'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search clients, files..." 
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, marginLeft: 8, width: '100%' }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  window.location.href = `/clients?search=${encodeURIComponent(e.currentTarget.value)}`;
                }
              }}
            />
          </div>
          <NotificationBell variant="mobile" />
        </div>
      </div>

      {/* Main grid */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>
          Main Menu
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {mainItems.map(item => (
            <IconCard key={item.href} {...item} />
          ))}
        </div>
      </div>

      {/* Admin section */}
      {isAdmin && (
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>
            ⚡ Administration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {adminItems.map(item => (
              <IconCard key={item.href} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div style={{ padding: '28px 16px 0' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            width: '100%', padding: '14px 20px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 16,
            color: '#f87171',
            fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer',
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
