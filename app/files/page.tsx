"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import UploadModal from '@/components/UploadModal';
import { 
  Folder, 
  File as FileIcon, 
  Download, 
  MoreVertical, 
  ChevronRight, 
  Search, 
  Upload,
  ArrowLeft,
  Grid,
  List as ListIcon,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  Share2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileItem {
  id: string;
  name: string;
  folder?: any;
  file?: any;
  size: number;
  lastModifiedDateTime: string;
  path: string;
}



function FileArchiveContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialPath = searchParams.get('path') || '';
  
  const [items, setItems] = useState<FileItem[]>([]);
  const [path, setPath] = useState<string>(initialPath);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    // If the URL changes (e.g. from a direct link), update the local path state
    const currentPath = searchParams.get('path');
    if (currentPath !== null) {
      setPath(currentPath);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/storage-gateway?path=${path}`);
        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.error || data.details || "Failed to fetch files";
          alert(`OneDrive Production Error: ${errorMsg}\n\nDetails: ${JSON.stringify(data.details || {})}`);
          throw new Error(errorMsg);
        }
        
        if (Array.isArray(data)) {
          const mappedData = data.map(item => ({
            ...item,
            // Override raw OneDrive IDs with human-readable paths for correct permission checks
            path: path ? `${path}/${item.name}` : item.name
          }));
          const sorted = mappedData.sort((a, b) => {
            if (a.folder && !b.folder) return -1;
            if (!a.folder && b.folder) return 1;
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          });
          setItems(sorted);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [path]);

  const handleFolderClick = (folderName: string) => {
    setPath((prev) => (prev ? `${prev}/${folderName}` : folderName));
  };

  const handleFileAction = (item: FileItem) => {
    if (item.folder) {
      handleFolderClick(item.name);
    } else {
      const ext = item.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(ext || '')) {
        setPreviewFile(item);                     // open preview modal
      } else {
        // Use a plain <a> link for download to avoid pop‑up blockers.
        const url = `/api/storage-gateway/download?path=${encodeURIComponent(item.path)}&mode=view&userId=${session?.user?.id || 'admin-id'}`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    }
  };

  const handleNativeShare = async () => {
    if (!previewFile) return;
    
    const url = `/api/storage-gateway/download?path=${encodeURIComponent(previewFile.path)}&userId=${session?.user?.id || 'admin-id'}`;
    
    try {
      // 1. Try to fetch the file blob
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], previewFile.name, { type: blob.type });

      // 2. Check if the browser can share files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: previewFile.name,
          text: `Check out this file: ${previewFile.name}`,
        });
        return; // Success!
      }
    } catch (err) {
      console.error("Native share failed:", err);
    }
    
    // 3. Fallback: Show the link-based menu if native file sharing fails
    setShowShareMenu(!showShareMenu);
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    
    try {
      const res = await fetch('/api/storage-gateway/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin-id' },
        body: JSON.stringify({ parentPath: path, folderName: name })
      });
      if (!res.ok) throw new Error("Failed to create folder");
      
      // Refresh logic
      window.location.reload();
    } catch (e) {
      alert("Error creating folder");
    }
  };

  const handleRename = async (oldPath: string) => {
    const newName = prompt("Enter new name:");
    if (!newName) return;

    try {
      await fetch('/api/storage-gateway/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin-id' },
        body: JSON.stringify({ path: oldPath, newName })
      });
    } catch (e) {
      alert("Error renaming");
    }
  };

  const handleDelete = async (itemPath: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
      await fetch(`/api/storage-gateway/delete?path=${itemPath}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'admin-id' }
      });
    } catch (e) {
      alert("Error deleting");
    }
  };

  // Back button – go up ONE level in the folder hierarchy.
  // If we are already at the root, do nothing (stay on /files).
  const handleBack = () => {
    if (!path) return;                 // already at root → stay on same page
    const parts = path.split('/');
    parts.pop();                       // remove last folder segment
    setPath(parts.join('/'));          // update state – stays on File Archive page
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '--';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex h-full w-full bg-corporate-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-x-auto md:overflow-x-hidden">
        {/* Header */}
        <header className="h-auto min-h-[4rem] bg-white border-b border-slate-200 pl-16 lg:px-8 px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3 overflow-x-auto md:overflow-x-visible scrollbar-hide">
            {path && (
              <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors shrink-0">
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap md:whitespace-normal">File Archive</h1>
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1 md:p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-amber-500" : "text-slate-400")}
              >
                <ListIcon size={16} />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1 md:p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-amber-500" : "text-slate-400")}
              >
                <Grid size={16} />
              </button>
            </div>
            
            <button 
              onClick={handleCreateFolder}
              className="hidden md:flex flex-1 md:flex-none text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-all items-center justify-center"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Folder
            </button>

            <button 
              onClick={() => setIsUploadOpen(true)}
              className="hidden md:flex flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all items-center justify-center"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Upload
            </button>
          </div>
        </header>

        {/* Global Modal Container */}
        <UploadModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          targetPath={path} 
        />

        {/* Breadcrumbs */}
        <div className="px-8 py-3 bg-slate-50 border-b border-slate-200 flex items-center text-xs font-medium text-slate-500 overflow-x-auto">
          <button onClick={() => setPath('')} className="hover:text-amber-500 transition-colors flex items-center shrink-0">
            Root
          </button>
          {path.split('/').filter(p => p).map((part, i, arr) => {
            const currentPath = arr.slice(0, i + 1).join('/');
            const isLast = i === arr.length - 1;
            return (
              <React.Fragment key={currentPath}>
                <ChevronRight size={14} className="mx-1 text-slate-300 shrink-0" />
                <button 
                  onClick={() => setPath(currentPath)}
                  disabled={isLast}
                  className={cn(
                    "truncate shrink-0 transition-colors",
                    isLast ? "text-slate-900 font-bold" : "hover:text-amber-500"
                  )}
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Folder size={64} className="mb-4 opacity-20" />
              <p>This folder is empty</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Last Modified</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr 
                      key={item.id} 
                      className="group hover:bg-slate-50 transition-colors cursor-pointer select-none"
                      onDoubleClick={() => handleFileAction(item)}
                    >
                      <td className="px-6 py-4 flex items-center">
                        {item.folder ? (
                          <Folder className="text-amber-400 mr-3 h-5 w-5" fill="currentColor" />
                        ) : (
                          <FileIcon className="text-slate-400 mr-3 h-5 w-5" />
                        )}
                        <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(item.lastModifiedDateTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatSize(item.size)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.folder && (
                            <button className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500" title="Download">
                              <Download size={16} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRename(item.path); }}
                            className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500" title="Rename"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.path); }}
                            className="p-1.5 hover:bg-red-100 rounded-md text-red-500 transition-colors" title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer text-center group select-none"
                  onDoubleClick={() => handleFileAction(item)}
                >
                  <div className="flex justify-center mb-3">
                    {item.folder ? (
                      <Folder className="text-amber-400 h-12 w-12" fill="currentColor" />
                    ) : (
                      <FileIcon className="text-slate-300 h-12 w-12 group-hover:text-amber-500 transition-colors" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 truncate w-full">{item.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatSize(item.size)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-2 md:p-10 overflow-y-auto">
            {/* Full‑screen modal for mobile – header stays fixed, actions always visible */}
            <div className="bg-white w-full h-full max-w-6xl rounded-xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-wrap gap-2">
                {/* File title */}
                <div className="flex items-center min-w-0">
                  <FileIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 truncate">{previewFile.name}</h3>
                </div>
                {/* Action toolbar – now wraps on small screens */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Share */}
                  <button onClick={handleNativeShare}
                    className="p-2 text-slate-500 hover:text-amber-500 transition-colors"
                    title="Share">
                    <Share2 size={20} />
                  </button>
                  {/* Download – use <a> for reliability */}
                  <a href={`/api/storage-gateway/download?path=${encodeURIComponent(previewFile.path)}&userId=${session?.user?.id || 'admin-id'}`}
                    className="p-2 text-slate-500 hover:text-amber-500 transition-colors"
                    title="Download">
                    <Download size={20} />
                  </a>
                  {/* Close */}
                  <button onClick={() => setPreviewFile(null)}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    title="Close">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                {previewFile.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={`/api/storage-gateway/download?path=${encodeURIComponent(previewFile.path)}&mode=view&userId=${session?.user?.id || 'admin-id'}`}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                ) : ['.jpg', '.jpeg', '.png', '.gif'].some(ext => previewFile.name.toLowerCase().endsWith(ext)) ? (
                  <img 
                    src={`/api/storage-gateway/download?path=${encodeURIComponent(previewFile.path)}&mode=view&userId=${session?.user?.id || 'admin-id'}`}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : previewFile.name.toLowerCase().endsWith('.txt') ? (
                  <iframe 
                    src={`/api/storage-gateway/download?path=${encodeURIComponent(previewFile.path)}&mode=view&userId=${session?.user?.id || 'admin-id'}`}
                    className="w-full h-full border-none bg-white p-10 font-mono text-sm"
                    title="Text Preview"
                  />
                ) : (
                  <div className="text-center text-white p-10">
                    <FileIcon size={80} className="mx-auto mb-6 opacity-20" />
                    <p className="text-lg font-medium mb-4">No Preview Available</p>
                    <a 
                      href={`/api/storage-gateway/download?path=${encodeURIComponent(previewFile.path)}&userId=${session?.user?.id || 'admin-id'}`}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-all inline-block"
                    >
                      Download to View
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Floating Action Buttons */}
        <div className="md:hidden fixed bottom-6 right-6 flex flex-col space-y-3 z-[90]">
          <button
            onClick={handleCreateFolder}
            className="w-12 h-12 bg-white text-slate-700 border border-slate-200 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <Upload size={28} />
          </button>
        </div>
      </main>
    </div>
  );
}

export default function FileArchive() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileArchiveContent />
    </Suspense>
  );
}
