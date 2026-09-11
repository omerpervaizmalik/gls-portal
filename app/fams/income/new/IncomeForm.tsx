"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, CheckCircle, ExternalLink, Send, ArrowRight, X, FileText, Loader2, RefreshCw } from "lucide-react";
import CategorySelect from "@/components/CategorySelect";
import { ClientOrWalkinSelect } from "./ClientOrWalkinSelect";
import { InvoiceModal } from "@/components/InvoiceModal";

interface ClientData {
  id: string;
  name: string;
  cfNo: string;
  mobileNo?: string | null;
  balance?: number;
}

interface IncomeFormProps {
  clients: ClientData[];
}

export function buildPaymentReceiptWhatsAppMessage({
  clientName,
  cfNo,
  invoiceNo,
  amount,
  serviceType,
  paymentMode,
  date,
  description,
  updatedBalance
}: {
  clientName: string;
  cfNo?: string | null;
  invoiceNo: string;
  amount: number;
  serviceType: string;
  paymentMode?: string | null;
  date?: string | Date;
  description?: string | null;
  updatedBalance?: number | null;
}) {
  const formattedDate = date 
    ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  let balanceText = "";
  if (updatedBalance !== undefined && updatedBalance !== null) {
    if (updatedBalance > 0) {
      balanceText = `• *Remaining Balance Due:* Rs. ${Math.abs(updatedBalance).toLocaleString()} (Pending)`;
    } else if (updatedBalance < 0) {
      balanceText = `• *Account Balance:* Rs. ${Math.abs(updatedBalance).toLocaleString()} (In Advance Credit)`;
    } else {
      balanceText = `• *Account Balance:* Rs. 0 (All Dues Cleared ✓)`;
    }
  }

  return `*PAYMENT ACKNOWLEDGEMENT & RECEIPT*
*Get Legal Solution*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${clientName}*${cfNo ? ` (CF No: ${cfNo})` : ""},

Thank you for your payment! We have successfully received and credited your payment to your account.

*Transaction Details:*
• *Receipt / Invoice No:* ${invoiceNo}
• *Amount Received:* Rs. ${amount.toLocaleString()}
• *Service Category:* ${serviceType}
${paymentMode ? `• *Mode of Payment:* ${paymentMode}\n` : ""}• *Date:* ${formattedDate}
${description ? `• *Reference / Note:* ${description}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━━━━━━
${balanceText ? `*Current Account Status:*\n${balanceText}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` : ""}
This is an official system-generated payment receipt from Get Legal Solution.

Thank you for your valued trust and business!

Warm regards,
*Get Legal Solution (GLS)*
Corporate, Tax & Legal Advisors`;
}

export function getWhatsAppReceiptUrl(mobileNo: string | null | undefined, message: string) {
  const cleanNumber = (mobileNo || "").replace(/[^0-9]/g, "");
  const finalNumber = cleanNumber
    ? cleanNumber.startsWith("0")
      ? "92" + cleanNumber.substring(1)
      : cleanNumber
    : "";

  return finalNumber
    ? `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function IncomeForm({ clients }: IncomeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Success / WhatsApp Receipt Modal State
  const [successData, setSuccessData] = useState<{
    invoiceNo: string;
    invoiceId: string;
    amount: number;
    serviceType: string;
    paymentMode?: string | null;
    date: string;
    description?: string | null;
    client?: { id: string; name: string; cfNo: string; mobileNo?: string | null } | null;
    updatedBalance?: number | null;
    waUrl?: string;
  } | null>(null);

  // Floating Invoice modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const amountStr = formData.get("amount") as string;
      const serviceType = formData.get("serviceType") as string;
      const paymentMode = formData.get("paymentMode") as string;
      const dateStr = formData.get("date") as string;
      const clientId = formData.get("clientId") as string;
      const description = formData.get("description") as string;
      const walkinName = formData.get("walkinName") as string;

      const payload = {
        amount: amountStr,
        serviceType,
        paymentMode,
        date: dateStr,
        clientId,
        description,
        walkinName
      };

      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to record payment");
      }

      const data = await res.json();

      let waUrl: string | undefined = undefined;
      if (data.client) {
        const message = buildPaymentReceiptWhatsAppMessage({
          clientName: data.client.name,
          cfNo: data.client.cfNo,
          invoiceNo: data.invoiceNo,
          amount: data.amount,
          serviceType: data.serviceType,
          paymentMode: data.paymentMode,
          date: data.date,
          description: data.description,
          updatedBalance: data.updatedBalance
        });

        waUrl = getWhatsAppReceiptUrl(data.client.mobileNo, message);

        // Attempt to launch WhatsApp immediately on submission
        try {
          window.open(waUrl, "_blank");
        } catch (err) {
          console.error("Popup prevented:", err);
        }
      }

      setSuccessData({
        ...data,
        waUrl
      });
    } catch (err: any) {
      alert(err.message || "An error occurred while saving payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setFormKey(prev => prev + 1);
  };

  return (
    <>
      <form key={formKey} onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
              Date *
            </label>
            <input 
              type="date" 
              id="date" 
              name="date" 
              required 
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          
          <ClientOrWalkinSelect clients={clients} />

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
              Amount Received (Rs) *
            </label>
            <input 
              type="number" 
              id="amount" 
              name="amount" 
              required 
              min="0"
              step="0.01"
              placeholder="e.g. 15000"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <CategorySelect 
            name="serviceType" 
            label="Service Type" 
            options={[
              "Income Tax",
              "Sales Tax",
              "Company Registration",
              "Corporate Law",
              "IPO",
              "Litigation",
              "General Consultation"
            ]} 
          />

          <CategorySelect 
            name="paymentMode" 
            label="Mode of Payment" 
            otherLabel="Other"
            options={[
              "Cash",
              "Bank Transfer UBL",
              "Bank Transfer Standard Chartered",
              "Jazz Cash",
              "Easy Paisa"
            ]} 
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea 
              id="description" 
              name="description" 
              rows={2}
              placeholder="Details or reference for this payment..."
              className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Submitting will generate a sequential invoice and WhatsApp payment receipt.
          </p>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center shadow-md shadow-amber-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recording Payment...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Record Payment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Payment Received & WhatsApp Receipt Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
              <button 
                onClick={() => setSuccessData(null)} 
                className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Payment Recorded Successfully!</h3>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    Invoice <span className="font-semibold text-white">#{successData.invoiceNo}</span> created & account credited.
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-sm space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Receipt</span>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Ref: #{successData.invoiceNo}
                  </span>
                </div>

                {successData.client && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client:</span>
                    <span className="font-semibold text-slate-800">
                      {successData.client.name} {successData.client.cfNo ? `(${successData.client.cfNo})` : ""}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Amount Received:</span>
                  <span className="text-lg font-black text-emerald-600">
                    Rs. {successData.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-medium text-slate-700">{successData.serviceType}</span>
                </div>

                {successData.paymentMode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-medium text-slate-700">{successData.paymentMode}</span>
                  </div>
                )}

                {successData.updatedBalance !== undefined && successData.updatedBalance !== null && (
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Updated Ledger Balance:</span>
                    <span className={`font-bold ${
                      successData.updatedBalance > 0 
                        ? "text-rose-600" 
                        : successData.updatedBalance < 0 
                          ? "text-emerald-600" 
                          : "text-slate-700"
                    }`}>
                      Rs. {Math.abs(successData.updatedBalance).toLocaleString()}{" "}
                      {successData.updatedBalance > 0 ? "(Pending Due)" : successData.updatedBalance < 0 ? "(In Advance)" : "(Cleared)"}
                    </span>
                  </div>
                )}
              </div>

              {/* WhatsApp Action */}
              {successData.client && successData.waUrl && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (successData.waUrl) {
                        window.open(successData.waUrl, "_blank");
                      }
                    }}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Send / Re-open WhatsApp Receipt</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    {successData.client.mobileNo 
                      ? `Target Number: ${successData.client.mobileNo}` 
                      : "No mobile number on file; WhatsApp will prompt you to select a contact."}
                  </p>
                </div>
              )}

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
                  View Invoice
                </button>
                <Link
                  href="/fams/income"
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4 mr-1.5 text-slate-500" />
                  Income Register
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Record Another Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating In-Window Invoice Modal */}
      {successData && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoiceId={successData.invoiceId}
          clientId={successData.client?.id}
          clientName={successData.client?.name}
        />
      )}
    </>
  );
}
