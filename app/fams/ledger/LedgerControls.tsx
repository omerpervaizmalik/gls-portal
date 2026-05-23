"use client";

import React, { useState } from "react";
import { Plus, Download, Printer, FileText, X, Loader2, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export function LedgerControls({ clientId, clientName, cfNo }: { clientId: string, clientName: string, cfNo?: string }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'DEBIT',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMode: ''
  });

  const [isFindingFolder, setIsFindingFolder] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleViewFolder = async () => {
    if (!cfNo) {
      alert("No CF number available for this client.");
      return;
    }
    
    setIsFindingFolder(true);
    try {
      const res = await fetch(`/api/clients/folder?cfNo=${cfNo}`);
      const data = await res.json();
      if (data.path) {
        window.location.href = `/files?path=${encodeURIComponent(data.path)}`;
      } else {
        alert("Client folder not found in the file directory.");
      }
    } catch (err) {
      alert("Error finding folder.");
    } finally {
      setIsFindingFolder(false);
    }
  };

  const handleGenerateInvoice = () => {
    // Open a new tab for the invoice generation
    window.open(`/fams/invoice/new?clientId=${clientId}`, '_blank');
  };

  const handleAddEntry = async (e: React.FormEvent | React.MouseEvent, generateInvoice: boolean = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, clientId })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        const { description, amount } = formData;
        setFormData({ type: 'DEBIT', amount: '', date: new Date().toISOString().split('T')[0], description: '', paymentMode: '' });
        router.refresh();
        
        if (generateInvoice) {
          window.open(`/fams/invoice/new?clientId=${clientId}&desc=${encodeURIComponent(description)}&amt=${amount}`, '_blank');
        }
      } else {
        alert("Failed to add entry");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 print:hidden">
        <button 
          onClick={handleViewFolder}
          disabled={isFindingFolder}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm print:hidden disabled:opacity-50"
        >
          {isFindingFolder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-2" />}
          View Folder
        </button>
        <button 
          onClick={handlePrint}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm"
        >
          <Printer className="w-4 h-4 mr-2" /> Print
        </button>
        <button 
          onClick={handleGenerateInvoice}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-emerald-500/20"
        >
          <FileText className="w-4 h-4 mr-2" /> Generate Invoice
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Entry
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Add Ledger Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => handleAddEntry(e, false)} className="p-6 space-y-4">
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
                  placeholder="e.g. 50000"
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
                  placeholder="Type description..."
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

              <div className="pt-4 border-t border-slate-100 flex justify-between gap-3">
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleAddEntry(e, true)}
                  className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
