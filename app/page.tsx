"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHomeScreen from '@/components/MobileHomeScreen';
import { isNative } from '@/lib/platform';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  FileBox, 
  UploadCloud, 
  UserPlus, 
  Activity,
  ArrowUpRight,
  Search,
  Bell,
  Files,
  ShieldCheck,
  Loader2,
  Clock,
  Folder,
  FolderOpen
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const iconMap: Record<string, any> = {
  'Active Clients': UserPlus,
  'Files Uploaded': FileBox,
  'Recent Activity (24h)': Activity,
  'Pending Filings': UploadCloud,
};

const colorMap: Record<string, string> = {
  'Active Clients': 'text-blue-600',
  'Files Uploaded': 'text-emerald-600',
  'Recent Activity (24h)': 'text-amber-600',
  'Pending Filings': 'text-rose-600',
};

const bgMap: Record<string, string> = {
  'Active Clients': 'bg-blue-50',
  'Files Uploaded': 'bg-emerald-50',
  'Recent Activity (24h)': 'bg-amber-50',
  'Pending Filings': 'bg-rose-50',
};

export default function Dashboard() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  
  const [onNative, setOnNative] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [corporateFolders, setCorporateFolders] = useState<any[]>([]);

  React.useEffect(() => {
    setOnNative(isNative());
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch Corporate Work MLA folders
    fetch('/api/files?path=Malik Law Associates/Corporate Work MLA')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCorporateFolders(data.filter(item => item.folder));
        }
      })
      .catch(console.error);
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: '100dvh', background: '#0a0f1e' }} />;
  }

  // On mobile app: show icon grid instead of desktop dashboard
  if (onNative) {
    return <MobileHomeScreen />;
  }

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      window.location.href = `/files?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 pl-16 lg:pl-8 px-4 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-full max-w-xs md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:block">
              <NotificationBell variant="desktop" />
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-200" />
            <span className="text-[10px] md:text-sm font-medium text-slate-700 truncate max-w-[80px] md:max-w-none">
              {isAdmin ? 'Admin' : 'Client'}
            </span>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <section>
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 space-y-4 md:space-y-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Executive Overview</h1>
                <p className="text-sm text-slate-500 mt-1">Management dashboard for GLS archives.</p>
              </div>
              <Link href="/files" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center shadow-lg shadow-amber-500/20">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload New Data
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg mb-4" />
                    <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
                    <div className="h-8 w-12 bg-slate-100 rounded" />
                  </div>
                ))
              ) : data?.stats?.map((stat: any) => {
                const Icon = iconMap[stat.label] || Activity;
                
                if (stat.label === 'Active Clients') {
                  return (
                    <Link key={stat.label} href="/clients" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg ${bgMap[stat.label]} ${colorMap[stat.label]} group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
                          <Icon size={20} />
                        </div>
                        <span className={`text-xs font-semibold flex items-center ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {stat.change} <ArrowUpRight size={12} className="ml-1" />
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </Link>
                  );
                }

                return (
                  <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${bgMap[stat.label] || 'bg-slate-50'} ${colorMap[stat.label] || 'text-slate-600'} p-2 rounded-lg`}>
                        <Icon size={20} />
                      </div>
                      <span className={`text-xs font-semibold flex items-center ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stat.change} <ArrowUpRight size={12} className="ml-1" />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-bold text-slate-900 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                    Recent Activity
                  </h2>
                  <Link href="/logs" className="text-xs font-bold text-amber-600 hover:underline">View All Logs</Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                    </div>
                  ) : data?.recentFiles?.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm italic">
                      No recent file operations found.
                    </div>
                  ) : data?.recentFiles?.map((file: any, i: number) => (
                    <div key={i} className="px-6 py-4 flex items-center hover:bg-slate-50 transition-colors group">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center mr-4 group-hover:bg-white transition-colors border border-slate-200">
                        <FileBox className="text-slate-400 h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">By {file.user} • {file.details || 'Uploaded'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{file.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-corporate-primary text-white rounded-xl p-6 shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2 text-amber-500">Cloud Integration</h3>
                  <p className="text-slate-400 text-xs mb-6">Your GLS drive is synced with the local permission matrix.</p>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Storage Health</span>
                      <span>Stable</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[72%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 -m-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Files size={160} />
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Quick Shortcuts</h3>
                <div className="space-y-2">
                  {isAdmin && (
                    <Link href="/admin/users" className="block w-full text-left px-4 py-2 rounded-lg text-sm bg-amber-50 hover:bg-amber-100 transition-colors text-amber-700 font-bold flex items-center group">
                      <ShieldCheck className="h-4 w-4 mr-2 text-amber-500 group-hover:scale-110 transition-transform" />
                      User Access Management
                    </Link>
                  )}
                  <Link href="/clients" className="block w-full text-left px-4 py-2 rounded-lg text-sm bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 font-medium flex items-center">
                    <UserPlus className="h-4 w-4 mr-2 text-slate-400" />
                    Link New Client Folder
                  </Link>
                  <Link href="/files?path=Malik Law Associates/Corporate Work MLA/Income TAX/TAX RETURNS" className="block w-full text-left px-4 py-2 rounded-lg text-sm bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 font-medium flex items-center">
                    <Files className="h-4 w-4 mr-2 text-blue-400" />
                    Tax Returns Archive
                  </Link>
                  <button className="w-full text-left px-4 py-2 rounded-lg text-sm bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 font-medium flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-slate-400" />
                    Generate Audit Report
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2 text-amber-500" />
                  Corporate Work MLA
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {corporateFolders.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center flex flex-col items-center">
                      <Loader2 className="h-5 w-5 animate-spin mb-2 text-amber-500" />
                      Loading directories...
                    </div>
                  ) : (
                    corporateFolders.map(folder => (
                      <Link 
                        key={folder.id} 
                        href={`/files?path=${encodeURIComponent(folder.path)}`}
                        className="block w-full text-left px-4 py-2.5 rounded-lg text-sm bg-slate-50 hover:bg-amber-50 transition-colors text-slate-700 hover:text-amber-700 font-semibold flex items-center group border border-transparent hover:border-amber-200"
                      >
                        <Folder className="h-4 w-4 mr-3 text-amber-400 group-hover:scale-110 transition-transform" fill="currentColor" />
                        <span className="truncate">{folder.name}</span>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
