"use client";

import React, { useState } from "react";
import { FileText, Edit2, Trash2, X, Loader2, Tag, Percent } from "lucide-react";
import { useRouter } from "next/navigation";
import { InvoiceModal } from "@/components/InvoiceModal";
import { isNative } from "@/lib/platform";

export function EntryActions({ entry, clientId }: { entry: any, clientId: string }) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasInvoice = !!entry.invoice || /^Invoice\s+(?:INV-[\w-]+|[\w-]+):/i.test(entry.description || "");

  // Extract invoice prefix if present, e.g. "Invoice INV-9271: "
  const invoicePrefixMatch = (entry.description || "").match(/^(Invoice\s+(?:INV-[\w-]+|[\w-]+):\s*)(.*)$/i);
  const invoicePrefix = invoicePrefixMatch 
    ? invoicePrefixMatch[1] 
    : (entry.invoice?.invoiceNo ? `Invoice ${entry.invoice.invoiceNo}: ` : "");
  
  const initialServiceDescription = invoicePrefixMatch 
    ? invoicePrefixMatch[2] 
    : (hasInvoice ? entry.description.replace(/^Invoice\s+[\w-]+:\s*/i, "") : (entry.description || ""));

  const initialDiscount = entry.invoice?.discount || 0;
  const initialGrossAmount = (entry.type === "DEBIT" && hasInvoice)
    ? (entry.amount + initialDiscount)
    : entry.amount;

  const [serviceDescription, setServiceDescription] = useState(initialServiceDescription);
  const [grossAmount, setGrossAmount] = useState<number | string>(initialGrossAmount);
  const [discount, setDiscount] = useState<number | string>(initialDiscount);
  const [entryType, setEntryType] = useState(entry.type);
  const [paymentMode, setPaymentMode] = useState(entry.paymentMode || "");
  const [entryDate, setEntryDate] = useState(
    entry.date ? new Date(entry.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  const handleGenerateInvoice = () => {
    const cleanDesc = entry.description ? entry.description.replace(/^Invoice\s+INV-\d+:\s*/i, '') : '';
    if (isNative()) {
      const qp = new URLSearchParams();
      if (clientId) qp.set("clientId", clientId);
      if (cleanDesc) qp.set("desc", cleanDesc);
      if (entry.amount !== undefined && entry.amount !== null) qp.set("amt", String(entry.amount));
      if (entry.id) qp.set("ledgerEntryId", entry.id);
      router.push(`/fams/invoice/new?${qp.toString()}`);
      return;
    }
    // Open in-window floating invoice modal instead of new tab
    setIsInvoiceModalOpen(true);
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isDebitInvoice = entryType === "DEBIT" && hasInvoice;
    const parsedGross = parseFloat(String(grossAmount)) || 0;
    const parsedDiscount = isDebitInvoice ? (parseFloat(String(discount)) || 0) : 0;
    const netAmount = isDebitInvoice ? Math.max(0, parsedGross - parsedDiscount) : parsedGross;

    const trimmedDesc = serviceDescription.trim();
    const finalDescription = isDebitInvoice && invoicePrefix 
      ? `${invoicePrefix}${trimmedDesc}`
      : trimmedDesc;

    const payload = {
      id: entry.id,
      type: entryType,
      amount: netAmount,
      date: entryDate,
      description: finalDescription || entry.description,
      serviceDescription: trimmedDesc,
      discount: parsedDiscount,
      paymentMode: entryType === "CREDIT" ? paymentMode : "",
      clientId
    };

    try {
      const res = await fetch("/api/ledgers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update entry");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${entry.type} entry of Rs. ${entry.amount}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/ledgers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, clientId })
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete entry");
        setIsDeleting(false);
      }
    } catch (err) {
      alert("An error occurred");
      setIsDeleting(false);
    }
  };

  const currentNetAmount = Math.max(0, (Number(grossAmount) || 0) - (Number(discount) || 0));

  return (
    <>
      <div className="flex gap-2 justify-end print:hidden">
        <button 
          onClick={handleGenerateInvoice}
          className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
          title={entry.invoice ? `View / Send Invoice (${entry.invoice.invoiceNo})` : "Generate Invoice for this entry"}
        >
          <FileText className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="text-amber-500 hover:text-amber-700 transition-colors p-1"
          title={hasInvoice ? "Modify Invoice & Ledger Entry" : "Modify Entry"}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={handleDeleteEntry}
          disabled={isDeleting}
          className="text-rose-500 hover:text-rose-700 transition-colors p-1 disabled:opacity-50"
          title="Delete entry"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {hasInvoice ? "Modify Invoice & Ledger Entry" : "Modify Ledger Entry"}
                </h3>
                {entry.invoice?.invoiceNo && (
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    {entry.invoice.invoiceNo}
                  </span>
                )}
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick full invoice editor shortcut if entry is an invoice */}
            {hasInvoice && (
              <div className="px-6 pt-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium text-indigo-900">
                      Need to edit multiple items or print?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 hover:border-indigo-300 px-3 py-1 rounded-lg transition-colors shadow-sm flex items-center gap-1"
                  >
                    Open Full Invoice Editor
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdateEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Transaction Type
                </label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none bg-white font-medium"
                  value={entryType}
                  onChange={e => setEntryType(e.target.value)}
                >
                  <option value="DEBIT">Invoice / Charge (Client Owes)</option>
                  <option value="CREDIT">Payment Received (Client Paid)</option>
                </select>
              </div>

              {entryType === "CREDIT" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mode of Payment
                  </label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-emerald-50 text-emerald-800 font-medium"
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                  >
                    <option value="">-- Select Payment Mode --</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="Bank Transfer UBL">Bank Transfer UBL</option>
                    <option value="Bank Transfer Standard Chartered">Bank Transfer Standard Chartered</option>
                    <option value="Jazz Cash">Jazz Cash</option>
                    <option value="Easy Paisa">Easy Paisa</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}

              {/* Service Description Input with clean template dropdown */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {hasInvoice ? "Description of Service" : "Description"}
                  </label>
                  {invoicePrefix && (
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      Prefix: {invoicePrefix.trim()}
                    </span>
                  )}
                </div>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Income Tax Return Filing"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 mb-2 font-medium text-slate-800 bg-white"
                  value={serviceDescription}
                  onChange={e => setServiceDescription(e.target.value)}
                />
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none"
                  onChange={e => {
                    if (e.target.value) {
                      setServiceDescription(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">-- Or select a standard service template --</option>
                  <optgroup label="Taxation Services (FBR)">
                    <option value="Income Tax Return Filing">Income Tax Return Filing</option>
                    <option value="NTN Registration (Individual/AOP/Company)">NTN Registration (Individual/AOP/Company)</option>
                    <option value="Sales Tax Registration (GST/PST)">Sales Tax Registration (GST/PST)</option>
                    <option value="Monthly Sales Tax Return Filing">Monthly Sales Tax Return Filing</option>
                    <option value="Withholding Tax Statement Filing">Withholding Tax Statement Filing</option>
                    <option value="Tax Audit Representation">Tax Audit Representation</option>
                    <option value="Tax Appeal & Litigation Representation">Tax Appeal & Litigation Representation</option>
                    <option value="Exemption Certificate Application">Exemption Certificate Application</option>
                  </optgroup>
                  <optgroup label="Company Registration (SECP)">
                    <option value="Company Incorporation & Registration">Company Incorporation & Registration</option>
                    <option value="Name Reservation (SECP)">Name Reservation (SECP)</option>
                    <option value="Annual Returns Filing (Form A / Form 29)">Annual Returns Filing (Form A / Form 29)</option>
                    <option value="Memorandum & Articles of Association Drafting">Memorandum & Articles of Association Drafting</option>
                    <option value="Certified True Copy (CTC) Issuance">Certified True Copy (CTC) Issuance</option>
                  </optgroup>
                  <optgroup label="General Legal & Corporate Fees">
                    <option value="Legal Consultation Fee">Legal Consultation Fee</option>
                    <option value="Retainer Fee">Retainer Fee</option>
                    <option value="Contract Drafting & Vetting">Contract Drafting & Vetting</option>
                    <option value="Court Appearance & Representation Fee">Court Appearance & Representation Fee</option>
                    <option value="Legal Notice & Reply Drafting">Legal Notice & Reply Drafting</option>
                  </optgroup>
                </select>
              </div>

              {/* Amount and Discount Section */}
              {entryType === "DEBIT" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Fee / Gross Amount (Rs.)
                      </label>
                      <input 
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="8000"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800"
                        value={grossAmount}
                        onChange={e => setGrossAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Discount (Rs.)</span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Optional
                        </span>
                      </label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-rose-600"
                        value={discount === 0 ? "" : discount}
                        onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                  </div>

                  {/* Net Amount Summary Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Net Amount (Debited to Ledger):</span>
                      <span className="font-extrabold text-base text-amber-600">
                        Rs. {currentNetAmount.toLocaleString()}
                      </span>
                    </div>
                    {Number(discount) > 0 && (
                      <span className="text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        Discount: Rs. {Number(discount).toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Amount Received (Rs.)
                  </label>
                  <input 
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800"
                    value={grossAmount}
                    onChange={e => setGrossAmount(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Date
                </label>
                <input 
                  required
                  type="date"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 flex items-center"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Window Floating Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          router.refresh();
        }}
        invoiceId={entry.invoice?.id}
        clientId={clientId}
        description={initialServiceDescription}
        amount={entry.amount}
        discount={entry.invoice?.discount || (Number(discount) || 0)}
        ledgerEntryId={entry.id}
        onInvoiceSaved={() => {
          router.refresh();
        }}
      />
    </>
  );
}
