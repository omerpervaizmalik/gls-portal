"use client";

import React, { useState } from 'react';

interface CategorySelectProps {
  options: string[];
  name: string;
  label?: string;
}

export default function CategorySelect({ options, name, label = "Category" }: CategorySelectProps) {
  const [isOther, setIsOther] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label} *</label>
      <select 
        onChange={(e) => setIsOther(e.target.value === "Other")}
        name={isOther ? undefined : name}
        required={!isOther}
        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      >
        <option value="">Select {label}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value="Other">Other (Please specify)</option>
      </select>
      
      {isOther && (
        <div className="mt-2">
          <input 
            type="text"
            name={name}
            required
            placeholder={`Enter custom ${label.toLowerCase()}...`}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      )}
    </div>
  );
}
