"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Database, 
  Download, 
  Upload, 
  Check,
  AlertCircle,
  Loader2,
  HardDriveDownload,
  FileJson,
  RefreshCw,
  Cloud,
  CloudUpload,
  RotateCcw,
  Trash2,
  FolderOpen,
  Clock
} from 'lucide-react';

interface BackupModule {
  id: string;
  name: string;
  description: string;
  group: string;
  companions?: string[];
}

interface CloudRestoreFile {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  path: string;
}

interface CloudBackupMeta {
  lastBackupAt?: string;
  lastFileName?: string;
  lastFileId?: string;
  lastSize?: number;
  lastTrigger?: string;
  folder?: string;
}

const MODULES: BackupModule[] = [
  // Core Directory & Access
  { id: 'User', name: 'Users, Profiles & Permissions', description: 'User accounts, lawyer profiles, folder permissions & notifications', group: 'Core & Directory', companions: ['UserProfile', 'Permission', 'Notification'] },
  { id: 'Client', name: 'Clients (Tax, Legal & Privileged)', description: 'All client accounts, CF numbers, IRIS credentials, categories & privileged flags', group: 'Core & Directory' },

  // Tax & Legal Operations
  { id: 'Filing', name: 'Tax Filing Records & History Logs', description: 'Annual tax filing workflow stages, bill/paid status, notes & history logs', group: 'Tax & Legal Workflow', companions: ['FilingLog'] },
  { id: 'Matter', name: 'Legal Matters & Cases', description: 'Client legal matters, case numbers & statuses', group: 'Tax & Legal Workflow' },
  { id: 'Task', name: 'Tasks, Attachments, Logs & Reminders', description: 'Kanban tasks, file attachment links, activity history & reminders', group: 'Tax & Legal Workflow', companions: ['TaskAttachment', 'TaskLog', 'Reminder'] },

  // FAMS (Financial & Accounting Management System)
  { id: 'LedgerEntry', name: 'Client Ledger Entries', description: 'All client debit (invoice/dues) and credit (payment) ledger transactions', group: 'Financials (FAMS)' },
  { id: 'Invoice', name: 'Invoices', description: 'Issued & cancelled client invoices, line items & discounts', group: 'Financials (FAMS)' },
  { id: 'IncomeRecord', name: 'Income & Payment Receipts', description: 'FAMS income records and walk-in / client payment receipts', group: 'Financials (FAMS)' },
  { id: 'Expense', name: 'Firm Expenses', description: 'All office & operational expense entries across categories', group: 'Financials (FAMS)' },
  { id: 'Quotation', name: 'Quotations', description: 'Client fee quotations and service estimates', group: 'Financials (FAMS)' },
  { id: 'Disbursement', name: 'Disbursements (Out-of-Pocket)', description: 'Client out-of-pocket expenses and challan/reclaim logs', group: 'Financials (FAMS)' },
  { id: 'FiscalYear', name: 'Fiscal Years', description: 'Configured fiscal year periods and active status', group: 'Financials (FAMS)' },

  // System Settings & Audit
  { id: 'SystemSetting', name: 'System Settings & Tax Categories', description: 'Custom expense/tax categories and portal configuration', group: 'System & Audit' },
  { id: 'ActivityLog', name: 'System Activity & Audit Logs', description: 'User login, navigation, file archive and security audit trail', group: 'System & Audit' },
];

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function AdminBackup() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  // OneDrive Cloud Restore Points state
  const [cloudFiles, setCloudFiles] = useState<CloudRestoreFile[]>([]);
  const [cloudMeta, setCloudMeta] = useState<CloudBackupMeta | null>(null);
  const [cloudFolder, setCloudFolder] = useState<string>('Malik Law Associates/Portal Backups');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [loadingCloud, setLoadingCloud] = useState(true);
  const [creatingCloud, setCreatingCloud] = useState(false);
  const [restoringCloudId, setRestoringCloudId] = useState<string | null>(null);
  const [deletingCloudId, setDeletingCloudId] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/backup/export?module=STATS');
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts || {});
      }
    } catch {
      // ignore stat errors
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchCloudBackups = useCallback(async () => {
    setLoadingCloud(true);
    setCloudError(null);
    try {
      const res = await fetch('/api/admin/backup/cloud');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load OneDrive backups');
      setCloudFiles(Array.isArray(data.files) ? data.files : []);
      setCloudMeta(data.meta || null);
      if (data.folder) setCloudFolder(data.folder);
      if (data.folderError) setCloudError(data.folderError);
    } catch (err: any) {
      setCloudError(err.message || 'Unable to connect to OneDrive');
    } finally {
      setLoadingCloud(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCloudBackups();
  }, [fetchStats, fetchCloudBackups]);

  const handleCreateCloudRestorePoint = async () => {
    try {
      setCreatingCloud(true);
      setMessage(null);
      const res = await fetch('/api/admin/backup/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save restore point to OneDrive');
      setMessage({
        type: 'success',
        text: `Restore Point "${data.meta?.lastFileName}" saved to OneDrive (${cloudFolder}).`,
      });
      fetchCloudBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save restore point to OneDrive.' });
    } finally {
      setCreatingCloud(false);
    }
  };

  const handleRestoreFromCloud = async (file: CloudRestoreFile) => {
    if (!confirm(`Restore complete portal from OneDrive restore point "${file.name}"?\n\nThis will merge or update all 20 database tables to match this snapshot.`)) {
      return;
    }
    try {
      setRestoringCloudId(file.id);
      setMessage(null);
      const res = await fetch('/api/admin/backup/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', fileId: file.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore from OneDrive');
      setMessage({
        type: 'success',
        text: `System restored from OneDrive snapshot "${file.name}" (${data.count || 0} records updated).`,
      });
      fetchStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to restore from OneDrive.' });
    } finally {
      setRestoringCloudId(null);
    }
  };

  const handleDeleteCloudFile = async (file: CloudRestoreFile) => {
    if (!confirm(`Delete restore point "${file.name}" from OneDrive?`)) return;
    try {
      setDeletingCloudId(file.id);
      const res = await fetch(`/api/admin/backup/cloud?fileId=${encodeURIComponent(file.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setCloudFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete restore point.' });
    } finally {
      setDeletingCloudId(null);
    }
  };

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
      
      setMessage({ type: 'success', text: `${moduleId === 'ALL' ? 'Complete System' : moduleId} exported successfully.` });
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
    if (!confirm(`Are you sure you want to restore ${moduleId === 'ALL' ? 'the COMPLETE SYSTEM' : `the ${moduleId} module`}? This will merge or overwrite existing records.`)) {
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

      setMessage({ type: 'success', text: `${moduleId === 'ALL' ? 'Complete system' : moduleId} restored successfully. Imported ${data.count || 0} records.` });
      fetchStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to import module.' });
    } finally {
      setImporting(null);
    }
  };

  const getModuleTotalCount = (mod: BackupModule) => {
    const main = counts[mod.id] || 0;
    const compSum = (mod.companions || []).reduce((acc, c) => acc + (counts[c] || 0), 0);
    return main + compSum;
  };

  const totalSystemRecords = Object.values(counts).reduce((a, b) => a + b, 0);
  const groups = Array.from(new Set(MODULES.map(m => m.group)));

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="min-h-[4rem] bg-white border-b border-slate-200 pl-16 lg:px-8 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <Database className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Backup & Restore</h1>
              <p className="text-xs text-slate-500">
                {loadingStats ? 'Loading database stats...' : `${MODULES.length} modules • ${totalSystemRecords.toLocaleString()} total records tracked`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => { fetchStats(); fetchCloudBackups(); }}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh Stats & Cloud Restore Points"
            >
              <RefreshCw className={`h-4 w-4 ${loadingStats || loadingCloud ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleImportClick('ALL')}
              disabled={importing === 'ALL'}
              className="bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center shadow-sm disabled:opacity-50"
            >
              {importing === 'ALL' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Restore From File
            </button>
            <button 
              onClick={() => handleExport('ALL')}
              disabled={exporting === 'ALL'}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {exporting === 'ALL' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4" />}
              Download Complete System
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
          {message && (
            <div className={`p-4 rounded-lg text-sm flex items-center ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {message.type === 'error' ? <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> : <Check className="h-4 w-4 mr-2 shrink-0" />}
              {message.text}
            </div>
          )}

          {/* OneDrive Automatic Cloud Restore Points */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-base font-bold">OneDrive Cloud Restore Points</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                      Auto-Saved Every 24h
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-1 flex items-center gap-1.5 flex-wrap">
                    <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono">{cloudFolder}</span>
                  </p>
                  {cloudMeta?.lastBackupAt && (
                    <p className="text-[11px] text-blue-100/90 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      Last saved: {new Date(cloudMeta.lastBackupAt).toLocaleString()} ({cloudMeta.lastTrigger || 'AUTO'})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <a
                  href={`/files?path=${encodeURIComponent(cloudFolder)}`}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center"
                >
                  <FolderOpen className="h-4 w-4 mr-1.5" />
                  Open in Files
                </a>
                <button
                  onClick={handleCreateCloudRestorePoint}
                  disabled={creatingCloud}
                  className="px-4 py-2 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-lg transition-colors flex items-center disabled:opacity-60"
                >
                  {creatingCloud ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CloudUpload className="h-4 w-4 mr-1.5" />}
                  {creatingCloud ? 'Saving to OneDrive...' : 'Save Restore Point Now'}
                </button>
              </div>
            </div>

            {cloudError && (
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 shrink-0 text-amber-600" />
                {cloudError}
              </div>
            )}

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {loadingCloud ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading OneDrive restore points...
                </div>
              ) : cloudFiles.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No restore points found in <span className="font-mono font-semibold">{cloudFolder}</span> yet. Click <strong>Save Restore Point Now</strong> to create your first cloud snapshot.
                </div>
              ) : (
                cloudFiles.map((file, idx) => (
                  <div key={file.id} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono truncate">{file.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Latest
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">{formatBytes(file.size)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Created: {new Date(file.lastModifiedDateTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreFromCloud(file)}
                        disabled={restoringCloudId === file.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center disabled:opacity-50 shadow-sm"
                        title="Restore entire portal from this OneDrive snapshot"
                      >
                        {restoringCloudId === file.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {restoringCloudId === file.id ? 'Restoring...' : '1-Click Restore'}
                      </button>
                      <a
                        href={`/api/storage-gateway/download?id=${encodeURIComponent(file.id)}`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Download JSON to computer"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteCloudFile(file)}
                        disabled={deletingCloudId === file.id}
                        className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Delete from OneDrive"
                      >
                        {deletingCloudId === file.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {groups.map((groupName) => (
            <div key={groupName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{groupName}</h2>
                <span className="text-xs font-semibold text-slate-400">
                  {MODULES.filter(m => m.group === groupName).length} modules
                </span>
              </div>
              
              <ul className="divide-y divide-slate-100">
                {MODULES.filter(m => m.group === groupName).map((mod) => {
                  const totalRecs = getModuleTotalCount(mod);
                  return (
                    <li key={mod.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                      <div className="flex items-start sm:items-center">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mr-4 border border-emerald-100 shrink-0">
                          <FileJson className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {loadingStats ? '...' : `${totalRecs.toLocaleString()} records`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            Table: {mod.id}{mod.companions ? ` + ${mod.companions.join(', ')}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2.5 shrink-0">
                        <button
                          onClick={() => handleImportClick(mod.id)}
                          disabled={importing === mod.id}
                          className="flex items-center px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
                        >
                          {importing === mod.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
                          Restore
                        </button>
                        <button
                          onClick={() => handleExport(mod.id)}
                          disabled={exporting === mod.id}
                          className="flex items-center px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md shadow-slate-900/10"
                        >
                          {exporting === mod.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                          Export JSON
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-amber-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Complete System Backup & Restore Notes
            </h3>
            <p className="text-xs text-amber-700 mt-2 leading-relaxed">
              The portal automatically saves a full 20-table Restore Point to your OneDrive folder (<strong>Malik Law Associates/Portal Backups</strong>) every 24 hours (and keeps the latest 30 restore points). You can also click <strong>Save Restore Point Now</strong> anytime or restore directly from any OneDrive snapshot in one click.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
