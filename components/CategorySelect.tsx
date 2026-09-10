"use client";

import React, { useState } from 'react';

interface CategorySelectProps {
  options: string[];
  name: string;
  label?: string;
  required?: boolean;
  otherLabel?: string;
}

export default function CategorySelect({ 
  options, 
  name, 
  label = "Category",
  required = true,
  otherLabel = "Other (Please specify)"
}: CategorySelectProps) {
  const [isOther, setIsOther] = useState(false);

  const cleanOptions = options.filter(opt => opt !== "Other");

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && "*"}
      </label>
      <select 
        onChange={(e) => setIsOther(e.target.value === "Other")}
        name={isOther ? undefined : name}
        required={required && !isOther}
        defaultValue=""
        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
      >
        <option value="">Select {label}</option>
        {cleanOptions.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value="Other">{otherLabel}</option>
      </select>
      
      {isOther && (
        <div className="mt-2">
          <input 
            type="text"
            name={name}
            required={required}
            autoFocus
            placeholder={`Enter custom ${label.toLowerCase()}...`}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      )}
    </div>
  );
}
