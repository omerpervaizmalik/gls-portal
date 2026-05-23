import React from "react";
import { Cell } from "./Cell"; // Cell component is defined in Cell.tsx

interface InfoRowProps {
  label: string;
  value: string | number | undefined;
  field: string;
  editing?: boolean;
  onChange?: (field: string, value: string) => void;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, field, editing = false, onChange }) => {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      {editing ? (
        <Cell field={field as any} value={value as any} editing={editing} onChange={onChange as any} />
      ) : (
        <span className={`text-sm ${!value ? "text-slate-300 italic" : "text-slate-700"}`}>
          {value ?? "Not provided"}
        </span>
      )}
    </div>
  );
};
