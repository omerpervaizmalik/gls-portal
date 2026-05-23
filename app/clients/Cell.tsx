import React, { useState, useEffect, useRef } from "react";
import { STATUS_OPTIONS, SERVICE_CATEGORIES } from "./constants";

export function Cell({
  value,
  field,
  editing,
  onChange,
}: {
  value?: string;
  field: string;
  editing: boolean;
  onChange: (f: string, v: string) => void;
}) {
  // Local value while editing to avoid re‑render losing cursor
  const [localValue, setLocalValue] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset local value and focus when entering edit mode
  useEffect(() => {
    if (editing) {
      setLocalValue(value ?? "");
      inputRef.current?.focus();
    }
  }, [editing, value]);

  const commitChange = () => {
    if (localValue !== value) {
      onChange(field, localValue);
    }
  };

  // Non‑editing view
  if (!editing) {
    return (
      <span className={`text-sm ${!value ? "text-slate-300 italic" : "text-slate-700"}`}>
        {value || "—"}
      </span>
    );
  }

  // Status dropdown (unchanged logic)
  if (field === "status") {
    return (
      <select
        value={localValue || "ACTIVE"}
        onChange={e => onChange(field, e.target.value)}
        className="w-full text-xs border border-amber-400 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50"
        autoFocus
        onBlur={commitChange}
      >
        {STATUS_OPTIONS.map(s => (
          <option key={s}>{s}</option>
        ))}
      </select>
    );
  }

  // Category dropdown with optional manual entry
  if (field === "category") {
    const isOther = !SERVICE_CATEGORIES.includes(localValue) && localValue !== "";
    return (
      <div className="flex flex-col space-y-1">
        <select
          value={SERVICE_CATEGORIES.includes(localValue) ? localValue : "Other"}
          onChange={e => {
            const val = e.target.value === "Other" ? "" : e.target.value;
            setLocalValue(val);
            onChange(field, val);
          }}
          className="w-full text-xs border border-amber-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50"
          autoFocus
        >
          <option value="">-- Select --</option>
          {SERVICE_CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
        {(isOther || localValue === "") && (
          <input
            type="text"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={commitChange}
            className="w-full text-[10px] border border-amber-300 rounded px-2 py-0.5 bg-white focus:outline-none"
            placeholder="Manual entry..."
          />
        )}
      </div>
    );
  }

  // Default text input for any other field
  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={commitChange}
      onKeyDown={e => {
        if (e.key === "Enter") {
          commitChange();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-full text-xs border border-amber-400 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50"
      placeholder={field}
    />
  );
}
