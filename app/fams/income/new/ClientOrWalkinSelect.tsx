"use client";

import React, { useState } from "react";

export function ClientOrWalkinSelect({ clients }: { clients: any[] }) {
  const [clientId, setClientId] = useState("");

  return (
    <>
      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-1">Client (Optional)</label>
        <select 
          id="clientId" 
          name="clientId" 
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Walk-in / No Client Selected</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.cfNo})</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">If selected, this payment will automatically deduct from their ledger balance.</p>
      </div>

      {!clientId && (
        <div>
          <label htmlFor="walkinName" className="block text-sm font-medium text-slate-700 mb-1">Walk-in Client Name (Optional)</label>
          <input 
            type="text" 
            id="walkinName" 
            name="walkinName" 
            placeholder="e.g. John Doe"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      )}
    </>
  );
}
