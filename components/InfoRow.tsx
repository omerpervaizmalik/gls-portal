// components/InfoRow.tsx
'use client';

import Cell from '@/components/Cell';

interface InfoRowProps {
  label: string;
  value?: string;
  /** field name used for editing – optional */
  field?: string;
  /** edit mode flag – controlled by parent */
  editing?: boolean;
  /** callback for field changes (required when editing) */
  onChange?: (field: string, value: string) => void;
}

/**
 * Displays a label/value pair. When `editing` is true and `field` + `onChange`
 * are supplied, the value becomes an inline‑editable Cell.
 */
export default function InfoRow({
  label,
  value,
  field,
  editing = false,
  onChange,
}: InfoRowProps) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      {editing && field && onChange ? (
        <Cell value={value} field={field} editing={true} onChange={onChange} />
      ) : (
        <span className="text-sm text-slate-700">{value ?? "—"}</span>
      )}
    </div>
  );
}
