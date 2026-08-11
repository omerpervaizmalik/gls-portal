"use client";

import React, { useState, useEffect } from "react";
import { Printer, ArrowLeft, Plus, Trash2, Download, Save, FileCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { Suspense } from 'react';

function InvoiceGeneratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get('clientId');
  const invoiceId = searchParams.get('id'); // Load existing invoice
  const paramDesc = searchParams.get('desc');
  const paramAmt = searchParams.get('amt');
  
  const [clientData, setClientData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Math.floor(Math.random() * 10000)}`);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState("ISSUED");
  
  const [items, setItems] = useState([
    { id: 1, description: paramDesc ? decodeURIComponent(paramDesc) : 'Legal Consultation Fee', amount: paramAmt ? Number(paramAmt) : 0 }
  ]);

  useEffect(() => {
    fetch('/api/clients?limit=1000')
      .then(res => res.json())
      .then(data => {
        const clientList = Array.isArray(data) ? data : data.clients || [];
        setClients(clientList);
        
        if (invoiceId) {
          // Fetch existing invoice data
          fetch(`/api/invoices?id=${invoiceId}`)
            .then(res => res.json())
            .then(invoices => {
              const inv = Array.isArray(invoices) ? invoices.find((i: any) => i.id === invoiceId) : null;
              if (inv) {
                setInvoiceNo(inv.invoiceNo);
                setInvoiceDate(new Date(inv.date).toISOString().split('T')[0]);
                setItems(inv.items);
                setInvoiceStatus(inv.status);
                const foundClient = clientList.find((c: any) => c.id === inv.clientId);
                if (foundClient) {
                  setClientData(foundClient);
                  setClientSearch(foundClient.name);
                }
              }
            });
        } else if (clientId) {
          const found = clientList.find((c: any) => c.id === clientId);
          if (found) {
            setClientData(found);
            setClientSearch(found.name);
          }
        }
      }).catch(e => console.error(e));
  }, [clientId, invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', amount: 0 }]);
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleSaveToLedger = async () => {
    if (!clientData) {
      alert("Please select a client first before saving.");
      return;
    }

    if (totalAmount <= 0) {
      alert("Invoice total must be greater than zero.");
      return;
    }

    setIsSaving(true);
    try {
      const url = invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices';
      const method = invoiceId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoiceId,
          invoiceNo,
          clientId: clientData.id,
          totalAmount,
          date: invoiceDate,
          items: items,
          status: 'ISSUED'
        })
      });

      if (!res.ok) throw new Error("Failed to save invoice");

      setIsSaved(true);
      alert(invoiceId ? "Invoice updated successfully." : "Invoice created and saved to ledger successfully.");
      
      if (!invoiceId) {
        // Redirect to the list or fresh view
        router.push('/fams/invoice');
      }
    } catch (err) {
      console.error(err);
      alert("Error saving invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoiceId) return;
    if (!confirm("Are you sure you want to cancel this invoice? This will remove the debit from the client's ledger.")) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to cancel invoice");
      
      setInvoiceStatus("CANCELLED");
      alert("Invoice has been cancelled and reversed from ledger.");
      router.push('/fams/invoice');
    } catch (err) {
      alert("Error cancelling invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.cfNo.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 5);


  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body, html {
            background: white !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}} />

      {/* Non-printable Controls */}
      <div className="max-w-4xl mx-auto mb-8 print:hidden flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <Link href={`/fams/ledger/${clientId || ''}`} className="flex items-center text-slate-500 hover:text-slate-700 font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </Link>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={addItem}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-bold flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </button>
          
          <button 
            onClick={handleSaveToLedger}
            disabled={isSaving || isSaved}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all shadow-lg ${
              isSaved 
                ? "bg-emerald-500 text-white cursor-default" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <FileCheck className="w-4 h-4 mr-2" />
                Saved to Ledger
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save to Ledger
              </>
            )}
          </button>

          <button 
            onClick={() => {
              let itemList = items.map((i, idx) => `${idx + 1}. ${i.description || 'Service'} - Rs. ${i.amount || 0}`).join('%0A');
              const text = `*INVOICE: ${invoiceNo}*%0A*From:* Get Legal Solution%0A*Billed To:* ${clientData?.name || 'Client'}%0A*Date:* ${invoiceDate}%0A------------------------%0A${itemList}%0A------------------------%0A*Total Due: Rs. ${totalAmount.toLocaleString()}*%0A%0A_Please find the detailed PDF attached or contact us to clear the payment._`;
              const url = `https://wa.me/?text=${text}`;
              window.open(url, '_blank');
            }}
            className="px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-sm font-bold flex items-center shadow-lg shadow-emerald-500/20 transition-all"
          >
            <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.384 0 12.03c0 2.127.554 4.2 1.602 6.02L.031 24l6.143-1.611a11.967 11.967 0 005.857 1.517v-.001h.001A12.031 12.031 0 0024 12.03C24 5.384 18.614 0 12.031 0zm0 21.962h-.001a10.024 10.024 0 01-5.111-1.396l-.367-.217-3.799.996.997-3.702-.238-.378a10.019 10.019 0 01-1.536-5.32C1.946 6.458 6.425 1.979 12.031 1.979A10.06 10.06 0 0122.052 12.03a10.06 10.06 0 01-10.021 9.932zm5.503-7.508c-.301-.151-1.782-.879-2.059-.979-.277-.101-.479-.151-.68.151-.202.302-.781.979-.957 1.18-.176.202-.353.227-.654.076-1.353-.68-2.316-1.226-3.197-2.736-.228-.393.111-.383.551-1.264.076-.151.038-.277-.038-.428-.076-.151-.68-1.638-.931-2.242-.244-.588-.492-.508-.68-.517-.176-.008-.378-.008-.58-.008s-.529.076-.806.378c-.277.302-1.058 1.033-1.058 2.518s1.083 2.921 1.234 3.123c.151.202 2.126 3.245 5.145 4.545 2.185.94 2.822.846 3.325.756.594-.106 1.782-.73 2.033-1.435.252-.705.252-1.31.176-1.435-.075-.126-.277-.202-.578-.353z"/></svg>
            WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center shadow-lg shadow-slate-500/20 transition-all"
          >
            <Printer className="w-4 h-4 mr-2" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Printable A4 Document Layout */}
      <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] print:min-h-[275mm] shadow-2xl print:shadow-none print:m-0 p-8 print:p-0 flex flex-col relative bg-white">
        
        {/* Letterhead Header */}
        <header className="border-b-2 border-amber-500 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <img src="/logo.jpeg" alt="Get Legal Solution Logo" className="h-14 w-auto object-contain" />
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Get Legal Solution</h1>
              <p className="text-[9px] md:text-[10px] font-bold text-amber-600 tracking-widest uppercase mt-1 mb-1.5">Advocates & Corporate Consultants</p>
              <p className="text-xs md:text-sm font-black text-slate-800 uppercase leading-none">OMER PERVAIZ MALIK</p>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mt-0.5">Advocate High Court • M.A, LLB</p>
            </div>
          </div>
          <div className="text-left md:text-right text-[10px] md:text-xs text-slate-600 space-y-0.5 pl-2 md:pl-0 border-l-2 md:border-l-0 border-amber-200 md:border-transparent">
            <p className="font-bold text-slate-800">Lahore Office</p>
            <p>132-Model Town Courts, Lahore</p>
            <p>Office no 1, 1st Floor, Bakhshi Tower, 1 Fane Road</p>
            <p className="mt-1 font-bold text-amber-600">+92 301 4991700</p>
            <p className="text-amber-600">info@getlegalsolution.com</p>
          </div>
        </header>

        {/* Invoice Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-200 tracking-widest uppercase">Invoice</h2>
        </div>

        {/* Client & Invoice Meta */}
        <div className="flex justify-between items-start mb-8 text-sm">
          <div className="w-1/2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</h3>
            
            <div className="relative print:hidden mb-2">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Search client by name or CF No..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                {clientData && (
                  <button 
                    onClick={() => { setClientData(null); setClientSearch(""); }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {showDropdown && clientSearch && !clientData && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClientData(c);
                          setClientSearch(c.name);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 transition-colors flex justify-between items-center border-b border-slate-50 last:border-0"
                      >
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{c.cfNo}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-500 italic">No clients found</div>
                  )}
                </div>
              )}
            </div>

            {clientData ? (
              <div className="text-slate-800 font-medium">
                <p className="text-lg font-bold flex items-center">
                  {clientData.name}
                  {invoiceStatus === 'CANCELLED' && (
                    <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] rounded-full uppercase tracking-widest font-black">Cancelled</span>
                  )}
                </p>
                <p className="text-xs">CF No: {clientData.cfNo}</p>
                {clientData.mobileNo && <p className="text-xs">Phone: {clientData.mobileNo}</p>}
              </div>
            ) : (
              <div className="space-y-1">
                <input type="text" placeholder="Client Name" className="w-full font-bold text-lg border-b border-dashed border-slate-300 focus:border-amber-500 outline-none text-slate-800 pb-0.5 bg-transparent" />
                <input type="text" placeholder="Address / Details" className="w-full text-xs border-b border-dashed border-slate-300 focus:border-amber-500 outline-none text-slate-600 pb-0.5 bg-transparent" />
              </div>
            )}
          </div>
          
          <div className="w-1/3 space-y-2 text-right">
            {invoiceId && invoiceStatus === 'ISSUED' && (
              <button 
                onClick={handleCancelInvoice}
                className="print:hidden text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest border border-rose-200 px-2 py-1 rounded hover:bg-rose-50 transition-all mb-2"
              >
                Cancel Invoice
              </button>
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Number</p>
              <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full text-right font-bold text-slate-800 outline-none border-b border-dashed border-slate-300 focus:border-amber-500 bg-transparent text-sm" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Issue</p>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full text-right font-bold text-slate-800 outline-none border-b border-dashed border-slate-300 focus:border-amber-500 bg-transparent text-sm" />
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800">
                <th className="py-2 px-2 text-xs font-bold uppercase tracking-wider w-12 text-center">No.</th>
                <th className="py-2 px-2 text-xs font-bold uppercase tracking-wider">Description of Service</th>
                <th className="py-2 px-2 text-xs font-bold uppercase tracking-wider text-right w-36">Amount (Rs.)</th>
                <th className="w-8 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-2 px-2 text-center text-slate-500 font-bold">{index + 1}</td>
                  <td className="py-2 px-2">
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Type service details..."
                      className="w-full outline-none text-slate-800 font-bold bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 pb-0.5 mb-1"
                    />
                    <select 
                      className="w-full text-[10px] bg-slate-50 border border-slate-200 text-slate-500 rounded p-1 outline-none focus:border-amber-500 print:hidden"
                      onChange={e => {
                        if (e.target.value) {
                          updateItem(item.id, 'description', e.target.value);
                          e.target.value = ""; // reset after selection
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Or select a template --</option>
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
                  </td>
                  <td className="py-2 px-2 text-right align-top">
                    <input 
                      type="number" 
                      value={item.amount || ''} 
                      onChange={e => updateItem(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full text-right outline-none text-slate-800 font-bold bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 pb-0.5"
                    />
                  </td>
                  <td className="print:hidden text-center align-top">
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-10 text-sm">
          <div className="w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2 text-slate-600">
              <span>Subtotal:</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-slate-600 border-b border-slate-200 pb-2">
              <span>Tax / Discount:</span>
              <span>-</span>
            </div>
            <div className="flex justify-between items-center text-lg font-black text-slate-900 mt-2">
              <span>Total Due:</span>
              <span className="text-amber-600">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-xs text-slate-500">
          <div className="text-center pb-4 mb-4 border-b border-slate-200">
            <p className="font-bold text-slate-600 italic">This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
          
          <div className="text-center text-[10px]">
            <p>Thank you for choosing Get Legal Solution. All payments are due within 15 days of invoice date.</p>
            <p className="mt-0.5">Please make cheques payable to "Get Legal Solution".</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function InvoiceGenerator() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoiceGeneratorContent />
    </Suspense>
  );
}
