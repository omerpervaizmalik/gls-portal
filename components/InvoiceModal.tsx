"use client";

import React, { useEffect } from "react";
import { X, FileText, ExternalLink } from "lucide-react";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
  clientId?: string;
  clientName?: string;
  description?: string;
  amount?: string | number;
  ledgerEntryId?: string;
  onInvoiceSaved?: (invoiceNo?: string) => void;
}

export function InvoiceModal({
  isOpen,
  onClose,
  invoiceId,
  clientId,
  clientName,
  description,
  amount,
  ledgerEntryId,
  onInvoiceSaved
}: InvoiceModalProps) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'INVOICE_SAVED') {
        if (onInvoiceSaved) {
          onInvoiceSaved(event.data.invoiceNo);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onInvoiceSaved]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const queryParams = new URLSearchParams();
  if (invoiceId) queryParams.set("id", invoiceId);
  if (clientId) queryParams.set("clientId", clientId);
  if (description) queryParams.set("desc", description);
  if (amount !== undefined && amount !== null && amount !== "") queryParams.set("amt", String(amount));
  if (ledgerEntryId) queryParams.set("ledgerEntryId", ledgerEntryId);
  queryParams.set("isModal", "true");

  const invoiceUrl = `/fams/invoice/new?${queryParams.toString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 print:hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Floating Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  {invoiceId ? "Invoice & Reminder" : "Generate Invoice"}
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
                  In-Window Tab
                </span>
              </div>
              {clientName && (
                <p className="text-xs text-slate-400 leading-tight mt-0.5">
                  Client: <span className="text-slate-200 font-medium">{clientName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={invoiceUrl.replace("&isModal=true", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Open full page in separate tab if needed"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close floating window (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Invoice Frame */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative">
          <iframe
            src={invoiceUrl}
            className="w-full h-full border-0"
            title="Invoice Generator"
          />
        </div>
      </div>
    </div>
  );
}
