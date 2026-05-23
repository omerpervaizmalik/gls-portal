"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  File as FileIcon, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Camera
} from 'lucide-react';
import { isNative } from '@/lib/platform';
import { DocumentScanner } from '@capacitor-mlkit/document-scanner';
import { Capacitor } from '@capacitor/core';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPath: string;
}

export default function UploadModal({ isOpen, onClose, targetPath }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(isNative());
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleScan = async () => {
    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        resultFormats: 'JPEG',
        scannerMode: 'FULL',
      });

      if (scannedImages && scannedImages.length > 0) {
        const newFiles: File[] = [];
        
        for (let i = 0; i < scannedImages.length; i++) {
          const uri = scannedImages[i];
          try {
            // Convert native file URI to a web-accessible URL to bypass CORS/local restrictions
            const webPath = Capacitor.convertFileSrc(uri);
            const response = await fetch(webPath);
            const blob = await response.blob();
            
            // Ask user for a custom name
            const defaultName = `scan_${Date.now()}_${i + 1}`;
            let customName = prompt(`Enter a name for the scanned document (${i + 1}/${scannedImages.length}):`, defaultName) || defaultName;
            
            // Ensure proper extension
            if (!customName.toLowerCase().endsWith('.jpg') && !customName.toLowerCase().endsWith('.jpeg')) {
              customName += '.jpg';
            }
            
            const file = new File([blob], customName, { type: 'image/jpeg' });
            newFiles.push(file);
          } catch (fileErr) {
            console.error('Error converting scanned image:', fileErr);
            alert(`Failed to process scanned image ${i + 1}`);
          }
        }

        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error('Scanning failed:', err);
      alert('Scanning failed. Please ensure camera permissions are granted and Google Play Services are up to date.');
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetFolderPath', targetPath);

        const res = await fetch('/api/storage-gateway', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Failed to upload file: ' + file.name);
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      // Force page reload to show new files while preserving the path
      if (targetPath) {
        window.location.href = window.location.pathname + '?path=' + encodeURIComponent(targetPath);
      } else {
        window.location.href = window.location.pathname;
      }
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg max-h-[calc(100dvh-2rem)] md:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <h3 className="font-bold text-slate-900 flex items-center">
            <Upload className="mr-2 h-4 w-4 text-blue-600" />
            Upload to {targetPath || 'Root'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-blue-500 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <Upload className="text-blue-600 h-6 w-6" />
              </div>
              <p className="font-bold text-slate-800 text-sm">Choose Files</p>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {isMobile && (
              <button 
                onClick={handleScan}
                className="border-2 border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-amber-50 hover:bg-amber-100 hover:border-amber-500 transition-all cursor-pointer group border-dashed"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="text-amber-600 h-6 w-6" />
                </div>
                <p className="font-bold text-amber-800 text-sm">Scan Document</p>
                <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Native Feature</p>
              </button>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Files ({files.length})</p>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {files.map((file, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center truncate mr-4">
                      <FileIcon className="text-slate-400 h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{file.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                <span className="flex items-center"><Loader2 size={12} className="animate-spin mr-1" /> Processing...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={files.length === 0 || uploading}
            onClick={handleUpload}
            className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            Start Upload
          </button>
        </div>
      </div>
    </div>
  );
}
