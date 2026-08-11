"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

export default function MonthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonthParam = searchParams.get("month");

  // Generate last 12 months for the dropdown
  const months = [];
  const today = new Date();
  
  // Also add "all" option
  months.push({ value: "all", label: "All Time" });

  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }

  const currentMonthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const selectedValue = currentMonthParam || currentMonthValue;

  return (
    <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
      <Calendar className="w-4 h-4 text-slate-500" />
      <select 
        value={selectedValue}
        onChange={(e) => router.push(`/fams?month=${e.target.value}`)}
        className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
      >
        {months.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
