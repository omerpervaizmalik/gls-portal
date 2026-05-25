"use client";

import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';

export default function ProfilePhotoUpload({ initialPhoto }: { initialPhoto: string | null }) {
  const [preview, setPreview] = useState<string | null>(initialPhoto);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  return (
    <div className="relative group shrink-0">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-8 h-8 text-slate-300" />
        )}
      </div>
      <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Upload className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-bold">Upload</span>
        <input 
          type="file" 
          name="profilePhotoFile" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
