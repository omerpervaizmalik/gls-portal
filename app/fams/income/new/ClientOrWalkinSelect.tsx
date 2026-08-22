"use client";

import React, { useState } from "react";
import SearchableCategorySelect from "@/components/SearchableCategorySelect";
import { SERVICE_CATEGORY_GROUPS } from "@/app/clients/constants";

export function ClientOrWalkinSelect({ clients }: { clients: any[] }) {
  const [localClients, setLocalClients] = useState(clients);
  const [clientId, setClientId] = useState("");
  const [qrName, setQrName] = useState("");
  const [qrPhone, setQrPhone] = useState("");
  const [qrCategory, setQrCategory] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    if (!qrName) return;
    setIsRegistering(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: qrName, mobileNo: qrPhone, category: qrCategory, clientType: "LEGAL" })
      });
      if (res.ok) {
        const newClient = await res.json();
        setLocalClients(prev => [...prev, newClient]);
        setClientId(newClient.id);
        setQrName("");
        setQrPhone("");
        setQrCategory("");
      }
    } catch (e) {
      console.error("Failed to register client", e);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <input type="hidden" name="clientId" value={clientId === "quick-register" ? "" : clientId} />
      
      <div>
        <label htmlFor="clientSelect" className="block text-sm font-medium text-slate-700 mb-1">Client (Optional)</label>
        <select 
          id="clientSelect" 
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Walk-in / No Client Selected</option>
          <option value="quick-register">Quick Register New Client</option>
          {localClients.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.cfNo ? `(${c.cfNo})` : ""}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">If selected, this payment will automatically deduct from their ledger balance.</p>
      </div>

      {clientId === "quick-register" && (
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4 mt-4">
          <h4 className="text-sm font-semibold text-slate-800">Quick Register New Client</h4>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
            <input 
              type="text" 
              value={qrName}
              onChange={e => setQrName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone (Optional)</label>
            <input 
              type="text" 
              value={qrPhone}
              onChange={e => setQrPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category (Optional)</label>
            <SearchableCategorySelect
              groups={SERVICE_CATEGORY_GROUPS}
              value={qrCategory}
              onChange={setQrCategory}
            />
          </div>
          <button
            type="button"
            onClick={handleRegister}
            disabled={!qrName || isRegistering}
            className="w-full px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {isRegistering ? "Registering..." : "Register & Select"}
          </button>
        </div>
      )}

      {clientId === "" && (
        <div className="mt-4">
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
