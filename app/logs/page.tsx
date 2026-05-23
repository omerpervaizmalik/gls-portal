"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  History, 
  Search, 
  Filter, 
  Download,
  Eye,
  Upload,
  Trash2,
  Lock,
  Loader2,
  RefreshCw,
  FileEdit,
  Database
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const getActionIcon = (action: string) => {
  const a = action.toUpperCase();
  if (a.includes('UPLOAD')) return <Upload size={14} className="text-emerald-500" />;
  if (a.includes('VIEW')) return <Eye size={14} className="text-blue-500" />;
  if (a.includes('DOWNLOAD')) return <Download size={14} className="text-sky-500" />;
  if (a.includes('DELETE')) return <Trash2 size={14} className="text-rose-500" />;
  if (a.includes('LOGIN_FAIL')) return <Lock size={14} className="text-rose-500" />;
  if (a.includes('PERMISSION') || a.includes('USER')) return <History size={14} className="text-amber-500" />;
  if (a.includes('UPDATE') || a.includes('EDIT')) return <FileEdit size={14} className="text-indigo-500" />;
  if (a.includes('SYNC')) return <RefreshCw size={14} className="text-emerald-400" />;
  return <Database size={14} className="text-slate-400" />;
};

export default function ActivityLogs() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isAdmin) fetchLogs();
  }, [fetchLogs, isAdmin]);

  if (!isAdmin && session) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6">You do not have permission to view system activity logs.</p>
          <a href="/" className="inline-block bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-x-auto md:overflow-x-hidden">
        <header className="h-auto min-h-[5rem] bg-white border-b border-slate-200 pl-16 lg:px-8 px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 space-y-4 md:space-y-0 sticky top-0 z-10">
          <div className="overflow-x-auto md:overflow-x-visible scrollbar-hide">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 whitespace-nowrap md:whitespace-normal">System Audit Logs</h1>
            <p className="text-[10px] md:text-xs text-slate-500 whitespace-nowrap md:whitespace-normal">Real-time tracking of system activities</p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
              onClick={fetchLogs}
              className="p-2 md:p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center">
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search Bar */}
          <div className="px-4 md:px-8 py-4 bg-white border-b border-slate-100 shrink-0">
            <div className="relative w-full max-w-xl">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-x-auto min-w-0">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Action Type</th>
                    <th className="px-6 py-5">Target Path / Details</th>
                    <th className="px-6 py-5">User</th>
                    <th className="px-6 py-5">Timestamp</th>
                    <th className="px-6 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Loader2 className="animate-spin h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Fetching real-time logs...</p>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 italic">
                        No activity logs found.
                      </td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2.5 bg-slate-100 rounded-xl mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                            {getActionIcon(log.action)}
                          </div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-600 truncate max-w-md">{log.path}</p>
                        {log.details && <p className="text-[10px] text-slate-400 mt-0.5">{log.details}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                           <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {(log.user?.name || log.userName || "??").substring(0,2).toUpperCase()}
                           </div>
                           <span className="text-xs font-bold text-slate-700">{log.user?.name || log.userName || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 font-bold font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                          Success
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Latest 100 System Events
              </p>
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 Real-time Connection Active
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
