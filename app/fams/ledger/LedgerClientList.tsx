"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, ArrowRight, CheckSquare, Square, Send, CheckCircle, Clock, X, AlertCircle, Phone, ArrowUpRight } from "lucide-react";

export interface ClientWithBalance {
  id: string;
  name: string;
  cfNo: string;
  mobileNo?: string | null;
  clientType?: string | null;
  balance: number;
}

interface LedgerClientListProps {
  clients: ClientWithBalance[];
}

export function LedgerClientList({ clients }: LedgerClientListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [sentStatus, setSentStatus] = useState<Record<string, "pending" | "sent" | "skipped">>({});
  const [activeQueueIndex, setActiveQueueIndex] = useState(0);

  // Helper to format reminder text
  const getReminderMessage = (client: ClientWithBalance) => {
    const dueAmount = Math.abs(client.balance).toLocaleString();
    return `*PAYMENT REMINDER - ACCOUNT STATEMENT*
*Client:* ${client.name} (CF No: ${client.cfNo})
*From:* Get Legal Solution

Dear Client,
This is a gentle reminder regarding your outstanding balance in your account ledger.

*Outstanding Balance Due: Rs. ${dueAmount}*

*Payment Details:*
*UBL ACCOUNT*
PK27UNIL0109000315815522
Get Legal Solution

*Jazz Cash*
03010407809
Pervaiz Malik

Please clear your pending balance at your earliest convenience and share the payment receipt/screenshot.

Thank you for choosing Get Legal Solution.
Regards,
GLS Management`;
  };

  // Helper to get WhatsApp URL
  const getWhatsAppUrl = (client: ClientWithBalance) => {
    const cleanNumber = (client.mobileNo || "").replace(/[^0-9]/g, "");
    const finalNumber = cleanNumber
      ? cleanNumber.startsWith("0")
        ? "92" + cleanNumber.substring(1)
        : cleanNumber
      : "";
    const message = getReminderMessage(client);

    return finalNumber
      ? `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  // Send single WhatsApp reminder
  const handleSingleWhatsApp = (e: React.MouseEvent, client: ClientWithBalance) => {
    e.preventDefault();
    e.stopPropagation();

    if (!client.mobileNo) {
      const proceed = confirm(`Client ${client.name} does not have a phone number saved. Do you still want to open WhatsApp?`);
      if (!proceed) return;
    }

    const url = getWhatsAppUrl(client);
    window.open(url, "_blank");
  };

  // Toggle selection for a single client
  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all currently filtered clients
  const handleSelectAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map((c) => c.id)));
    }
  };

  // Select only clients with positive dues (balance > 0)
  const handleSelectAllDue = () => {
    const dueClients = clients.filter((c) => c.balance > 0);
    setSelectedIds(new Set(dueClients.map((c) => c.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Selected clients list
  const selectedClients = clients.filter((c) => selectedIds.has(c.id));
  const totalSelectedDue = selectedClients
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  // Open Bulk Modal
  const openBulkModal = () => {
    if (selectedClients.length === 0) return;
    const initialStatus: Record<string, "pending" | "sent" | "skipped"> = {};
    selectedClients.forEach((c) => {
      initialStatus[c.id] = "pending";
    });
    setSentStatus(initialStatus);
    setActiveQueueIndex(0);
    setIsBulkModalOpen(true);
  };

  // Send next in bulk queue
  const handleSendNext = () => {
    if (activeQueueIndex >= selectedClients.length) return;
    const client = selectedClients[activeQueueIndex];
    const url = getWhatsAppUrl(client);
    window.open(url, "_blank");

    setSentStatus((prev) => ({ ...prev, [client.id]: "sent" }));

    // Advance to next pending client
    if (activeQueueIndex + 1 < selectedClients.length) {
      setActiveQueueIndex(activeQueueIndex + 1);
    }
  };

  // Skip current client in queue
  const handleSkipCurrent = () => {
    if (activeQueueIndex >= selectedClients.length) return;
    const client = selectedClients[activeQueueIndex];
    setSentStatus((prev) => ({ ...prev, [client.id]: "skipped" }));

    if (activeQueueIndex + 1 < selectedClients.length) {
      setActiveQueueIndex(activeQueueIndex + 1);
    }
  };

  // Send specific client from within bulk modal list
  const handleSendFromList = (client: ClientWithBalance, index: number) => {
    const url = getWhatsAppUrl(client);
    window.open(url, "_blank");
    setSentStatus((prev) => ({ ...prev, [client.id]: "sent" }));
    setActiveQueueIndex(index);
  };

  const allSelected = clients.length > 0 && selectedIds.size === clients.length;
  const clientsWithDueCount = clients.filter((c) => c.balance > 0).length;

  return (
    <>
      {/* Top Selection & Action Bar */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-amber-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            {allSelected ? "Deselect All" : "Select All"}
          </button>

          <button
            onClick={handleSelectAllDue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors"
          >
            Select All with Dues ({clientsWithDueCount})
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
            >
              Clear selection
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">{selectedIds.size}</span> selected
              {totalSelectedDue > 0 && (
                <span className="ml-1 text-rose-600 font-semibold">
                  (Due: Rs. {totalSelectedDue.toLocaleString()})
                </span>
              )}
            </div>

            <button
              onClick={openBulkModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all animate-in fade-in"
            >
              <Send className="w-3.5 h-3.5" />
              Send Reminders on WhatsApp ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100">
        {clients.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500">
            No clients found.
          </div>
        ) : (
          clients.map((client, index) => {
            const isSelected = selectedIds.has(client.id);

            return (
              <div
                key={client.id}
                className={`p-5 hover:bg-slate-50/80 transition-all group flex flex-col justify-between relative ${
                  isSelected ? "bg-amber-50/40 ring-1 ring-amber-400" : ""
                } ${
                  index % 3 !== 2 && index !== clients.length - 1
                    ? "lg:border-r border-slate-100"
                    : ""
                } ${
                  index % 2 !== 1 && index !== clients.length - 1
                    ? "sm:border-r border-slate-100"
                    : ""
                }`}
              >
                {/* Card Header: Checkbox, Avatar, Name */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      {/* Selection Checkbox */}
                      <button
                        onClick={(e) => toggleSelect(e, client.id)}
                        className="mt-1 text-slate-400 hover:text-amber-600 p-0.5 rounded transition-colors"
                        title={isSelected ? "Deselect client" : "Select client for bulk reminder"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>

                      <Link href={`/fams/ledger/${client.id}`} className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors truncate text-sm">
                            {client.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>{client.cfNo}</span>
                            {client.mobileNo && (
                              <span className="text-[11px] text-slate-400">
                                • {client.mobileNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>

                    <Link
                      href={`/fams/ledger/${client.id}`}
                      className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors shrink-0"
                      title="View Ledger Statement"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Card Footer: Balance & Individual WhatsApp Reminder Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Balance
                    </p>
                    <p
                      className={`font-bold text-sm leading-tight ${
                        client.balance > 0
                          ? "text-rose-600"
                          : client.balance < 0
                          ? "text-emerald-600"
                          : "text-slate-700"
                      }`}
                    >
                      Rs. {Math.abs(client.balance).toLocaleString()}
                      {client.balance > 0 && (
                        <span className="text-[10px] ml-1 font-normal text-rose-500">(Due)</span>
                      )}
                      {client.balance < 0 && (
                        <span className="text-[10px] ml-1 font-normal text-emerald-500">(Advance)</span>
                      )}
                    </p>
                  </div>

                  {/* Individual WhatsApp Reminder Button */}
                  <button
                    onClick={(e) => handleSingleWhatsApp(e, client)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                      client.balance > 0
                        ? "bg-[#25D366] hover:bg-[#128C7E] text-white shadow-emerald-500/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                    title={
                      client.balance > 0
                        ? `Send WhatsApp payment reminder for Rs. ${client.balance.toLocaleString()} to ${client.name}`
                        : `Send account statement via WhatsApp to ${client.name}`
                    }
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 0C5.385 0 0 5.384 0 12.03c0 2.127.554 4.2 1.602 6.02L.031 24l6.143-1.611a11.967 11.967 0 005.857 1.517v-.001h.001A12.031 12.031 0 0024 12.03C24 5.384 18.614 0 12.031 0zm0 21.962h-.001a10.024 10.024 0 01-5.111-1.396l-.367-.217-3.799.996.997-3.702-.238-.378a10.019 10.019 0 01-1.536-5.32C1.946 6.458 6.425 1.979 12.031 1.979A10.06 10.06 0 0122.052 12.03a10.06 10.06 0 01-10.021 9.932zm5.503-7.508c-.301-.151-1.782-.879-2.059-.979-.277-.101-.479-.151-.68.151-.202.302-.781.979-.957 1.18-.176.202-.353.227-.654.076-1.353-.68-2.316-1.226-3.197-2.736-.228-.393.111-.383.551-1.264.076-.151.038-.277-.038-.428-.076-.151-.68-1.638-.931-2.242-.244-.588-.492-.508-.68-.517-.176-.008-.378-.008-.58-.008s-.529.076-.806.378c-.277.302-1.058 1.033-1.058 2.518s1.083 2.921 1.234 3.123c.151.202 2.126 3.245 5.145 4.545 2.185.94 2.822.846 3.325.756.594-.106 1.782-.73 2.033-1.435.252-.705.252-1.31.176-1.435-.075-.126-.277-.202-.578-.353z" />
                    </svg>
                    <span>{client.balance > 0 ? "Reminder" : "Statement"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bulk WhatsApp Reminder Queue Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#25D366]/20 text-[#25D366] rounded-lg">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Bulk WhatsApp Reminders
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedClients.length} clients queued • Total Due: Rs. {totalSelectedDue.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Stepper / Next Sender Card */}
            {activeQueueIndex < selectedClients.length ? (
              <div className="p-5 bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-200/60 px-2 py-0.5 rounded">
                    Current #{activeQueueIndex + 1} of {selectedClients.length}
                  </span>
                  <h4 className="font-bold text-lg text-slate-900 mt-1">
                    {selectedClients[activeQueueIndex].name}
                  </h4>
                  <p className="text-xs text-slate-600">
                    CF No: <span className="font-medium">{selectedClients[activeQueueIndex].cfNo}</span> • Phone:{" "}
                    <span className="font-medium text-slate-800">
                      {selectedClients[activeQueueIndex].mobileNo || "No number saved"}
                    </span>
                  </p>
                  <p className="text-sm font-bold text-rose-600 mt-0.5">
                    Due: Rs. {Math.abs(selectedClients[activeQueueIndex].balance).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSkipCurrent}
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSendNext}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 0C5.385 0 0 5.384 0 12.03c0 2.127.554 4.2 1.602 6.02L.031 24l6.143-1.611a11.967 11.967 0 005.857 1.517v-.001h.001A12.031 12.031 0 0024 12.03C24 5.384 18.614 0 12.031 0zm0 21.962h-.001a10.024 10.024 0 01-5.111-1.396l-.367-.217-3.799.996.997-3.702-.238-.378a10.019 10.019 0 01-1.536-5.32C1.946 6.458 6.425 1.979 12.031 1.979A10.06 10.06 0 0122.052 12.03a10.06 10.06 0 01-10.021 9.932zm5.503-7.508c-.301-.151-1.782-.879-2.059-.979-.277-.101-.479-.151-.68.151-.202.302-.781.979-.957 1.18-.176.202-.353.227-.654.076-1.353-.68-2.316-1.226-3.197-2.736-.228-.393.111-.383.551-1.264.076-.151.038-.277-.038-.428-.076-.151-.68-1.638-.931-2.242-.244-.588-.492-.508-.68-.517-.176-.008-.378-.008-.58-.008s-.529.076-.806.378c-.277.302-1.058 1.033-1.058 2.518s1.083 2.921 1.234 3.123c.151.202 2.126 3.245 5.145 4.545 2.185.94 2.822.846 3.325.756.594-.106 1.782-.73 2.033-1.435.252-.705.252-1.31.176-1.435-.075-.126-.277-.202-.578-.353z" />
                    </svg>
                    Send on WhatsApp (Next)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-100 text-emerald-800 text-center font-bold text-sm">
                🎉 All queued reminders have been processed!
              </div>
            )}

            {/* Queued Clients Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Client</th>
                    <th className="px-3 py-2.5">Phone</th>
                    <th className="px-3 py-2.5 text-right">Balance Due</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedClients.map((client, idx) => {
                    const status = sentStatus[client.id] || "pending";
                    const isCurrent = idx === activeQueueIndex;

                    return (
                      <tr
                        key={client.id}
                        className={`transition-colors ${
                          isCurrent
                            ? "bg-amber-50/60 font-semibold"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800">{client.name}</p>
                          <p className="text-[10px] text-slate-400">CF: {client.cfNo}</p>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {client.mobileNo || (
                            <span className="text-amber-600 font-medium">Missing</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-rose-600">
                          Rs. {Math.abs(client.balance).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {status === "sent" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Sent
                            </span>
                          ) : status === "skipped" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Skipped
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => handleSendFromList(client, idx)}
                            className="text-[#25D366] hover:text-[#128C7E] font-bold text-xs inline-flex items-center gap-1 p-1"
                            title="Send WhatsApp reminder now"
                          >
                            Send <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Tip: Click "Send on WhatsApp (Next)" to open each chat in sequence without browser popup blocks.
              </p>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
