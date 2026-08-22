"use client";

import React, { useState } from "react";
import { FileText, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function EntryActions({ entry, clientId }: { entry: any, clientId: string }) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: entry.id,
    type: entry.type,
    amount: entry.amount,
    date: new Date(entry.date).toISOString().split('T')[0],
    description: entry.description,
    paymentMode: entry.paymentMode || ''
  });

  const handleGenerateInvoice = () => {
    // Strip any existing "Invoice INV-XXXX: " prefix from the description
    const cleanDesc = entry.description.replace(/^Invoice\s+INV-\d+:\s*/i, '');
    window.open(`/fams/invoice/new?clientId=${clientId}&desc=${encodeURIComponent(cleanDesc)}&amt=${entry.amount}`, '_blank');
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/ledgers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsEditModalOpen(false);
        router.refresh();
      } else {
        alert("Failed to update entry");
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
      const res = await fetch('/api/ledgers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id })
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

  return (
    <>
      <div className="flex gap-2 justify-end print:hidden">
        <button 
          onClick={handleGenerateInvoice}
          className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
          title="Generate Invoice for this entry"
        >
          <FileText className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="text-amber-500 hover:text-amber-700 transition-colors p-1"
          title="Modify entry"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Modify Ledger Entry</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Type</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none bg-white"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value, paymentMode: e.target.value === 'DEBIT' ? '' : formData.paymentMode })}
                >
                  <option value="DEBIT">Invoice / Charge (Client Owes)</option>
                  <option value="CREDIT">Payment Received (Client Paid)</option>
                </select>
              </div>

              {formData.type === 'CREDIT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mode of Payment</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-emerald-50 text-emerald-800 font-medium"
                    value={formData.paymentMode}
                    onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                  >
                    <option value="">-- Select Payment Mode --</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="Jazz Cash">Jazz Cash</option>
                    <option value="Easy Paisa">Easy Paisa</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (Rs.)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <input 
                  required
                  type="date"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 mb-2"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none"
                  onChange={e => {
                    if (e.target.value) {
                      setFormData({ ...formData, description: e.target.value });
                      e.target.value = ""; // reset after selection
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">-- Or select a standard service --</option>
                  <optgroup label="General & Corporate Legal Fees">
                    <option value="Retainer Fee">Retainer Fee</option>
                    <option value="Lump Sum / Flat Fee">Lump Sum / Flat Fee</option>
                    <option value="Hourly Billing Rate">Hourly Billing Rate</option>
                    <option value="Contingency Fee">Contingency Fee</option>
                    <option value="Success Fee">Success Fee</option>
                    <option value="Legal Research & Precedent Analysis Fee">Legal Research & Precedent Analysis Fee</option>
                    <option value="Drafting & Vetting Fee (Contracts, Deeds, Bylaws)">Drafting & Vetting Fee (Contracts, Deeds, Bylaws)</option>
                    <option value="Legal Opinion Fee">Legal Opinion Fee</option>
                    <option value="Due Diligence Audit Fee">Due Diligence Audit Fee</option>
                    <option value="Court Appearance & Representation Fee">Court Appearance & Representation Fee</option>
                    <option value="Corporate Secretarial Service Fee">Corporate Secretarial Service Fee</option>
                  </optgroup>
                  <optgroup label="Company Registration Matters (SECP)">
                    <option value="User Registration Fee (eZfile Portal access)">User Registration Fee (eZfile Portal access)</option>
                    <option value="Name Reservation Fee">Name Reservation Fee</option>
                    <option value="Company Incorporation/Registration Fee (Based on Authorized Capital)">Company Incorporation/Registration Fee (Based on Authorized Capital)</option>
                    <option value="Form A / Form 29 Filing Fee (Annual Returns/Director Changes)">Form A / Form 29 Filing Fee (Annual Returns/Director Changes)</option>
                    <option value="Memorandum & Articles of Association Drafting Fee">Memorandum & Articles of Association Drafting Fee</option>
                    <option value="Certified True Copy (CTC) Issuance Fee">Certified True Copy (CTC) Issuance Fee</option>
                    <option value="Mortgage or Charge Registration Fee">Mortgage or Charge Registration Fee</option>
                    <option value="Status Conversion Fee (e.g., Private to Public or SMC)">Status Conversion Fee (e.g., Private to Public or SMC)</option>
                    <option value="Issuance of Further Share Capital Fee">Issuance of Further Share Capital Fee</option>
                  </optgroup>
                  <optgroup label="Taxation Services (FBR)">
                    <option value="NTN Registration Fee (Individual, AOP, or Company)">NTN Registration Fee (Individual, AOP, or Company)</option>
                    <option value="Income Tax Return Filing Fee (Annual)">Income Tax Return Filing Fee (Annual)</option>
                    <option value="Sales Tax Registration Fee (GST/PST)">Sales Tax Registration Fee (GST/PST)</option>
                    <option value="Monthly Sales Tax Filing Fee (Federal or Provincial)">Monthly Sales Tax Filing Fee (Federal or Provincial)</option>
                    <option value="Withholding Tax Statement Filing Fee">Withholding Tax Statement Filing Fee</option>
                    <option value="Tax Audit Representation Fee">Tax Audit Representation Fee</option>
                    <option value="Tax Appeal & Litigation Fee (Commissioner or Tribunal)">Tax Appeal & Litigation Fee (Commissioner or Tribunal)</option>
                    <option value="Exemption Certificate Application Fee">Exemption Certificate Application Fee</option>
                  </optgroup>
                  <optgroup label="Out-of-Pocket Expenses (Disbursements)">
                    <option value="Official Government/Challan Fees">Official Government/Challan Fees</option>
                    <option value="Stamp Paper & Duty Charges">Stamp Paper & Duty Charges</option>
                    <option value="Process Serving & Courier Fees">Process Serving & Courier Fees</option>
                    <option value="Printing, Binding, and Stationery Charges">Printing, Binding, and Stationery Charges</option>
                    <option value="Travel & Outstation Lodging Expenses">Travel & Outstation Lodging Expenses</option>
                    <option value="Notarization & Attestation Charges">Notarization & Attestation Charges</option>
                  </optgroup>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 flex items-center"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
