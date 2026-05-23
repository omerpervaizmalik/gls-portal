"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LocalNotifications } from '@capacitor/local-notifications';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const requestPermissions = async () => {
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
    if (isCapacitor) {
      await LocalNotifications.requestPermissions();
    } else if ("Notification" in window) {
      await Notification.requestPermission();
    }
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 seconds for more real-time feel
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'all' }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  if (variant === 'mobile') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button 
          style={{
            width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', color: '#f1f5f9'
          }} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <div style={{ position: 'absolute', top: 10, right: 12, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid #0f1e3d' }} />
          )}
        </button>

        {isOpen && (
          <div 
            className="fixed inset-x-4 top-20 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl z-[100] max-h-[70vh] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Mark all as read</button>
              )}
            </div>

            {typeof window !== 'undefined' && (
              <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                <button 
                  onClick={requestPermissions}
                  className="text-xs font-bold text-amber-500 flex items-center justify-center w-full"
                >
                  <Bell size={12} className="mr-2" />
                  Enable Mobile Pop-up Alerts
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto py-2">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic">No notifications yet.</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-4 border-b border-slate-800/50 last:border-0 transition-colors",
                      !n.isRead ? "bg-white/5" : "opacity-60"
                    )}
                    onClick={() => !n.isRead && markAsRead(n.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                        n.type === 'TASK' ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {n.type}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center">
                        <Clock size={10} className="mr-1" />
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white text-sm font-bold mb-1">{n.title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] font-bold text-amber-600 hover:underline uppercase tracking-wider">Mark all as read</button>
            )}
          </div>
          
          {typeof window !== 'undefined' && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
              <button 
                onClick={requestPermissions}
                className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center"
              >
                <Bell size={10} className="mr-2" />
                Click to enable pop-up alerts
              </button>
            </div>
          )}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={cn(
                    "px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer",
                    !n.isRead && "bg-amber-50/30"
                  )}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={cn(
                      "text-sm font-bold",
                      !n.isRead ? "text-slate-900" : "text-slate-500"
                    )}>{n.title}</p>
                    {!n.isRead && <div className="h-2 w-2 bg-amber-500 rounded-full mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{n.message}</p>
                  <div className="flex items-center text-[10px] text-slate-400 font-medium">
                    <Clock size={10} className="mr-1" />
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50">
            <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700">Clear all</button>
          </div>
        </div>
      )}
    </div>
  );
}
