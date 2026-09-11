"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, UserPlus, Check, UserX, Loader2, AlertCircle, CheckCircle2, Receipt } from "lucide-react";
import SearchableCategorySelect from "@/components/SearchableCategorySelect";
import { SERVICE_CATEGORY_GROUPS } from "@/app/clients/constants";

export function ClientOrWalkinSelect({ clients }: { clients: any[] }) {
  const [localClients, setLocalClients] = useState(clients);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isQuickRegister, setIsQuickRegister] = useState(false);

  const [qrName, setQrName] = useState("");
  const [qrPhone, setQrPhone] = useState("");
  const [qrCategory, setQrCategory] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedClient) {
          setSearchTerm(`${selectedClient.name}${selectedClient.cfNo ? ` (${selectedClient.cfNo})` : ""}`);
        } else {
          setSearchTerm("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedClient]);

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setSearchTerm(`${client.name}${client.cfNo ? ` (${client.cfNo})` : ""}`);
    setIsQuickRegister(false);
    setIsOpen(false);
  };

  const handleSelectWalkin = () => {
    setSelectedClient(null);
    setSearchTerm("");
    setIsQuickRegister(false);
    setIsOpen(false);
  };

  const handleOpenQuickRegister = (initialName: string = "") => {
    setSelectedClient(null);
    setSearchTerm("");
    setQrName(initialName);
    setIsQuickRegister(true);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedClient(null);
    setSearchTerm("");
    setIsQuickRegister(false);
    setIsOpen(true);
  };

  const handleFillDueAmount = (due: number) => {
    const amountInput = document.getElementById("amount") as HTMLInputElement | null;
    if (amountInput && due > 0) {
      amountInput.value = String(due);
      amountInput.dispatchEvent(new Event("input", { bubbles: true }));
      amountInput.focus();
    }
  };

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
        const clientWithBal = { ...newClient, balance: 0 };
        setLocalClients(prev => [clientWithBal, ...prev]);
        setSelectedClient(clientWithBal);
        setSearchTerm(`${newClient.name}${newClient.cfNo ? ` (${newClient.cfNo})` : ""}`);
        setIsQuickRegister(false);
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

  // Filter clients based on user typing
  const cleanTerm = searchTerm.toLowerCase().trim();
  const filteredClients = localClients.filter(c => {
    if (!cleanTerm) return true;
    const nameMatch = c.name?.toLowerCase().includes(cleanTerm);
    const cfMatch = c.cfNo ? String(c.cfNo).toLowerCase().includes(cleanTerm) : false;
    return nameMatch || cfMatch;
  });

  const clientId = selectedClient?.id || "";

  return (
    <>
      <input type="hidden" name="clientId" value={clientId} />
      
      <div className="relative" ref={containerRef}>
        <label htmlFor="clientSearchInput" className="block text-sm font-medium text-slate-700 mb-1">
          Client (Optional)
        </label>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          
          <input 
            id="clientSearchInput"
            type="text"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedClient(null);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Type to search client by name or CF number..."
            className={`w-full pl-9 pr-16 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
              selectedClient ? "border-amber-500 bg-amber-50/20 font-medium text-slate-800" : "border-slate-200 bg-white"
            }`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {selectedClient && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {selectedClient ? (
          <div className="mt-3 p-3.5 rounded-xl border bg-gradient-to-r from-slate-50 to-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                (selectedClient.balance || 0) > 0 
                  ? 'bg-rose-100 text-rose-600' 
                  : (selectedClient.balance || 0) < 0 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-slate-100 text-slate-600'
              }`}>
                {(selectedClient.balance || 0) > 0 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (selectedClient.balance || 0) < 0 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Receipt className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Outstanding Dues
                  </span>
                  {(selectedClient.balance || 0) > 0 && (
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">
                      Pending Due
                    </span>
                  )}
                  {(selectedClient.balance || 0) < 0 && (
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                      Advance Balance
                    </span>
                  )}
                  {(selectedClient.balance || 0) === 0 && (
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                      Nil Balance
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-xl font-extrabold ${
                    (selectedClient.balance || 0) > 0 
                      ? 'text-rose-600' 
                      : (selectedClient.balance || 0) < 0 
                        ? 'text-emerald-600' 
                        : 'text-slate-800'
                  }`}>
                    Rs. {Math.abs(selectedClient.balance || 0).toLocaleString()}
                  </span>
                  {(selectedClient.balance || 0) > 0 && (
                    <span className="text-xs font-semibold text-rose-500">(Client owes)</span>
                  )}
                  {(selectedClient.balance || 0) < 0 && (
                    <span className="text-xs font-semibold text-emerald-600">(Credit in advance)</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ✓ Recorded payment will automatically credit to {selectedClient.name}&apos;s ledger.
                </p>
              </div>
            </div>

            {(selectedClient.balance || 0) > 0 && (
              <button
                type="button"
                onClick={() => handleFillDueAmount(selectedClient.balance)}
                className="self-start sm:self-center px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shrink-0 flex items-center shadow-sm"
                title="Populate the Amount field with this exact due amount"
              >
                Auto-fill Rs. {selectedClient.balance.toLocaleString()}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-1">
            If selected, this payment will automatically deduct from their ledger balance.
          </p>
        )}

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto overflow-x-hidden divide-y divide-slate-100 animate-in fade-in duration-100">
            <div className="p-1">
              <button
                type="button"
                onClick={handleSelectWalkin}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                  !selectedClient && !isQuickRegister ? "bg-amber-50 text-amber-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center">
                  <UserX className="w-4 h-4 mr-2 text-slate-400" />
                  Walk-in / No Client Selected
                </span>
                {!selectedClient && !isQuickRegister && <Check className="w-4 h-4 text-amber-600" />}
              </button>

              <button
                type="button"
                onClick={() => handleOpenQuickRegister(cleanTerm)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center text-amber-600 hover:bg-amber-50 font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Quick Register New Client {cleanTerm ? `"${cleanTerm}"` : ""}
              </button>
            </div>

            <div className="p-1 max-h-56 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Existing Clients ({filteredClients.length})
              </div>
              
              {filteredClients.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  <p>No clients match &ldquo;{searchTerm}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickRegister(cleanTerm)}
                    className="mt-2 inline-flex items-center text-xs font-semibold text-amber-600 hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" /> Quick Register as New Client
                  </button>
                </div>
              ) : (
                filteredClients.map((c) => {
                  const isCurrent = selectedClient?.id === c.id;
                  const balance = c.balance || 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClient(c)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                        isCurrent ? "bg-amber-50 text-amber-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">{c.name}</span>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {c.cfNo && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            CF: {c.cfNo}
                          </span>
                        )}
                        {balance > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Due: Rs. {balance.toLocaleString()}
                          </span>
                        ) : balance < 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Adv: Rs. {Math.abs(balance).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100">
                            Rs. 0
                          </span>
                        )}
                        {isCurrent && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {isQuickRegister && (
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4 mt-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center">
              <UserPlus className="w-4 h-4 mr-1.5 text-amber-600" />
              Quick Register New Client
            </h4>
            <button
              type="button"
              onClick={() => setIsQuickRegister(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Cancel
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
            <input 
              type="text" 
              value={qrName}
              onChange={e => setQrName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone (Optional)</label>
            <input 
              type="text" 
              value={qrPhone}
              onChange={e => setQrPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
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
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleRegister}
              disabled={!qrName || isRegistering}
              className="flex-1 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center shadow-sm"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register & Select"
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsQuickRegister(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!selectedClient && !isQuickRegister && (
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
