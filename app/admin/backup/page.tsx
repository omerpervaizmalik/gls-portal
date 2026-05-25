"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Database, 
  Download, 
  Upload, 
  Check,
  AlertCircle,
  Loader2,
  HardDriveDownload,
  FileJson
} from 'lucide-react';

const MODULES = [
  { id: 'User', name: 'Users & Profiles' },
  { id: 'Client', name: 'Clients' },
  { id: 'Matter', name: 'Matters' },
  { id: 'Task', name: 'Tasks & Logs' },
  { id: 'Filing', name: 'Tax Filings' },
  { id: 'Invoice', name: 'Invoices' },
  { id: 'LedgerEntry', name: 'Ledger Entries' },
];

export default function AdminBackup() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleExport = async (moduleId: string) => {
    try {
      setExporting(moduleId);
      setMessage(null);
      
      const res = await fetch(`/api/admin/backup/export?module=${moduleId}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gls_backup_${moduleId.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: `${moduleId} module exported successfully.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to export module.' });
    } finally {
      setExporting(null);
    }
  };

  const handleImportClick = (moduleId: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) handleImport(moduleId, file);
    };
    fileInput.click();
  };

  const handleImport = async (moduleId: string, file: File) => {
    if (!confirm(`Are you sure you want to restore the ${moduleId} module? This will merge or overwrite existing records.`)) {
      return;
    }

    try {
      setImporting(moduleId);
      setMessage(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', moduleId);

      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setMessage({ type: 'success', text: `${moduleId} module restored successfully. Imported ${data.count || 0} records.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to import module.' });
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-emerald-500" />
            <h1 className="text-lg font-bold text-slate-900">Backup & Restore</h1>
          </div>
          
          <button 
            onClick={() => handleExport('ALL')}
            disabled={exporting === 'ALL'}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {exporting === 'ALL' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4" />}
            Download Complete System
          </button>
        </header>

        <div className="p-8 max-w-5xl mx-auto">
          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm flex items-center ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {message.type === 'error' ? <AlertCircle className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-800">Module-by-Module Backup</h2>
              <p className="text-sm text-slate-500 mt-1">Export specific database modules to JSON for offline safekeeping, or restore a previously downloaded JSON backup. The complete system download includes all modules.</p>
            </div>
            
            <ul className="divide-y divide-slate-100">
              {MODULES.map((mod) => (
                <li key={mod.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mr-4 border border-emerald-100">
                      <FileJson className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                      <p className="text-xs text-slate-500">System identifier: {mod.id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleImportClick(mod.id)}
                      disabled={importing === mod.id}
                      className="flex items-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
                    >
                      {importing === mod.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Restore
                    </button>
                    <button
                      onClick={() => handleExport(mod.id)}
                      disabled={exporting === mod.id}
                      className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md shadow-slate-900/10"
                    >
                      {exporting === mod.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Export JSON
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-amber-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Offline Installable Sync Note
            </h3>
            <p className="text-xs text-amber-700 mt-2 leading-relaxed">
              For a fully offline installable software version that synchronizes automatically with the cloud, a dedicated desktop application wrapper (e.g., Electron) connected to a local SQLite mirror is required. The current JSON-based module Backup & Restore system provides a manual failsafe and point-in-time recovery for your modules directly from the web interface.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
