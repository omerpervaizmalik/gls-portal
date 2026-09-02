"use client";

import React, { useState, useEffect } from "react";
import { Printer, ArrowLeft, Plus, Trash2, Download, Save, FileCheck, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import SearchableCategorySelect from '@/components/SearchableCategorySelect';
import { SERVICE_CATEGORY_GROUPS } from '@/app/clients/constants';

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
  const [invoiceNo, setInvoiceNo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState("ISSUED");
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickRegData, setQuickRegData] = useState({ name: '', phone: '', category: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  const handleQuickRegister = async () => {
    if (!quickRegData.name) {
      alert("Name is required");
      return;
    }
    setIsRegistering(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickRegData.name,
          mobileNo: quickRegData.phone,
          category: quickRegData.category,
          clientType: 'LEGAL'
        })
      });
      if (!res.ok) throw new Error("Failed to register client");
      const data = await res.json();
      setClientData(data);
      setClientSearch(data.name);
      setShowQuickRegister(false);
      setQuickRegData({ name: '', phone: '', category: '' });
      setClients(prev => [...prev, data]);
    } catch (error) {
      console.error(error);
      alert("Error registering client");
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Strip "Invoice INV-XXXX: " prefix from description passed via URL params
  const cleanDescription = (desc: string) => {
    return desc.replace(/^Invoice\s+INV-\d+:\s*/i, '');
  };

  const [items, setItems] = useState([
    { id: 1, description: paramDesc ? cleanDescription(decodeURIComponent(paramDesc)) : 'Legal Consultation Fee', amount: paramAmt ? Number(paramAmt) : 0 }
  ]);

  useEffect(() => {
    // Fetch the next sequential invoice number for new invoices
    if (!invoiceId) {
      fetch('/api/invoices')
        .then(res => res.json())
        .then(invoices => {
          if (Array.isArray(invoices) && invoices.length > 0) {
            // invoices are ordered by createdAt desc, so first one is latest
            const lastInvoiceNo = invoices[0].invoiceNo || "INV-0";
            const lastNum = parseInt(lastInvoiceNo.replace(/\D/g, '') || "0", 10);
            setInvoiceNo(`INV-${lastNum + 1}`);
          } else {
            setInvoiceNo("INV-1");
          }
        })
        .catch(() => setInvoiceNo("INV-1"));
    }

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
                } else if (inv.walkinName) {
                  setClientData({ name: inv.walkinName, cfNo: "WALK-IN", address: "Walk-in Client" });
                  setClientSearch(inv.walkinName);
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

  const getInvoiceFileName = () => {
    const descSummary = items
      .map(i => i.description?.trim())
      .filter(Boolean)
      .join(' - ') || 'Legal Services';
    const cleanDesc = descSummary.replace(/[\\/:*?"<>|]/g, '-').trim();
    const cleanInvoiceNo = (invoiceNo || 'INV').replace(/[\\/:*?"<>|]/g, '-').trim();
    const fullName = `${cleanInvoiceNo} - ${cleanDesc}`;
    return fullName.length > 80 ? fullName.substring(0, 80).trim() : fullName;
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = getInvoiceFileName();
    }
  }, [invoiceNo, items]);

  const handlePrint = () => {
    if (typeof document !== 'undefined') {
      document.title = getInvoiceFileName();
    }
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
    if (!clientData && !invoiceId) { // Allow saving updates to walkin invoices
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

  // Dynamic sizing to force single page print
  const isCompact = items.length > 4;
  const isVeryCompact = items.length > 8;

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }
          body > div {
            background: #ffffff !important;
            background-color: #ffffff !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-height: 297mm !important;
            height: 100% !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
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
              const itemList = items.map((i, idx) => `${idx + 1}. ${i.description || 'Service'} - Rs. ${Number(i.amount || 0).toLocaleString()}`).join('\n');
              const message = `*INVOICE: ${invoiceNo}*
*From:* Get Legal Solution
*Billed To:* ${clientData?.name || 'Client'}
*Date:* ${invoiceDate}
------------------------
${itemList}
------------------------
*Total Due: Rs. ${totalAmount.toLocaleString()}*

*Payment Details:*
*UBL ACCOUNT*
PK27UNIL0109000315815522
Get Legal Solution

*Jazz Cash*
03010407809
Pervaiz Malik

Please pay your bill and send screenshot as soon as possible.

Regards,
GLS AI Assistant`;

              const cleanNumber = (clientData?.mobileNo || '').replace(/[^0-9]/g, '');
              const finalNumber = cleanNumber ? (cleanNumber.startsWith('0') ? '92' + cleanNumber.substring(1) : cleanNumber) : '';
              const url = finalNumber 
                ? `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`
                : `https://wa.me/?text=${encodeURIComponent(message)}`;
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
      <div id="printable-invoice" className={`max-w-[210mm] mx-auto bg-white min-h-[297mm] print:min-h-0 shadow-2xl p-8 print:p-0 flex flex-col relative`}>
        
        {/* Letterhead Header */}
        <header className={`border-b-2 border-amber-500 flex flex-col md:flex-row print:flex-row justify-between items-start ${isVeryCompact ? 'pb-2 mb-2 space-y-2' : isCompact ? 'pb-4 mb-4 space-y-3' : 'pb-6 mb-6 space-y-4'} md:space-y-0 print:space-y-0`}>
          <div className="flex items-center space-x-4">
            <img src="/logo.jpeg" alt="Get Legal Solution Logo" className="h-14 w-auto object-contain" />
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Get Legal Solution</h1>
              <p className="text-[9px] md:text-[10px] font-bold text-amber-600 tracking-widest uppercase mt-1 mb-1.5">Advocates & Corporate Consultants</p>
              <p className="text-xs md:text-sm font-black text-slate-800 uppercase leading-none">OMER PERVAIZ MALIK</p>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mt-0.5">Advocate High Court • M.A, LLB</p>
            </div>
          </div>
          <div className="text-left md:text-right print:text-right text-[10px] md:text-xs text-slate-600 space-y-0.5 pl-2 md:pl-0 print:pl-0 border-l-2 md:border-l-0 print:border-l-0 border-amber-200 md:border-transparent">
            <p className="font-bold text-slate-800">Lahore Office</p>
            <p>132-Model Town Courts, Lahore</p>
            <p>Office no 1, 1st Floor, Bakhshi Tower, 1 Fane Road</p>
            <p className="mt-1 font-bold text-amber-600">+92 301 4991700</p>
            <p className="text-amber-600">info@getlegalsolution.com</p>
            <p className="text-amber-600">www.getlegalsolution.com</p>
          </div>
        </header>

        {/* Invoice Title */}
        <div className={`text-center ${isVeryCompact ? 'mb-2' : isCompact ? 'mb-4' : 'mb-6'}`}>
          <h2 className={`${isVeryCompact ? 'text-lg' : isCompact ? 'text-xl' : 'text-2xl'} font-black text-slate-200 tracking-widest uppercase`}>Invoice</h2>
        </div>

        {/* Client & Invoice Meta */}
        <div className={`flex justify-between items-start text-sm ${isVeryCompact ? 'mb-2' : isCompact ? 'mb-4' : 'mb-8'}`}>
          <div className="w-1/2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</h3>
            
            <div className="relative print:hidden mb-2">
              <div className="flex gap-2 items-center">
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
                {!clientData && (
                  <button
                    onClick={() => setShowQuickRegister(!showQuickRegister)}
                    className="flex-shrink-0 flex items-center px-2 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-[10px] font-bold transition-colors"
                  >
                    <UserPlus className="w-3 h-3 mr-1" /> Quick Register
                  </button>
                )}
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

            {showQuickRegister && !clientData && (
              <div className="print:hidden mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name (Required)"
                    value={quickRegData.name}
                    onChange={e => setQuickRegData({...quickRegData, name: e.target.value})}
                    className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded outline-none focus:border-amber-500 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone (Optional)"
                    value={quickRegData.phone}
                    onChange={e => setQuickRegData({...quickRegData, phone: e.target.value})}
                    className="w-1/3 text-xs px-2 py-1.5 border border-slate-200 rounded outline-none focus:border-amber-500 bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white rounded border border-slate-200">
                    <SearchableCategorySelect
                      groups={SERVICE_CATEGORY_GROUPS}
                      name="category"
                      placeholder="Select Category..."
                      value={quickRegData.category}
                      onChange={(val) => setQuickRegData({...quickRegData, category: val})}
                    />
                  </div>
                  <button
                    onClick={handleQuickRegister}
                    disabled={isRegistering || !quickRegData.name}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded transition-colors flex items-center"
                  >
                    {isRegistering ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                    Register
                  </button>
                </div>
              </div>
            )}

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
        <div className={`${isVeryCompact ? 'mb-2' : isCompact ? 'mb-4' : 'mb-8'}`}>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800">
                <th className={`${isVeryCompact ? 'py-1 text-[10px]' : isCompact ? 'py-1.5 text-xs' : 'py-2 text-xs'} px-2 font-bold uppercase tracking-wider w-12 text-center`}>No.</th>
                <th className={`${isVeryCompact ? 'py-1 text-[10px]' : isCompact ? 'py-1.5 text-xs' : 'py-2 text-xs'} px-2 font-bold uppercase tracking-wider`}>Description of Service</th>
                <th className={`${isVeryCompact ? 'py-1 text-[10px]' : isCompact ? 'py-1.5 text-xs' : 'py-2 text-xs'} px-2 font-bold uppercase tracking-wider text-right w-36`}>Amount (Rs.)</th>
                <th className="w-8 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className={`${isVeryCompact ? 'py-1 text-[10px]' : isCompact ? 'py-1.5 text-xs' : 'py-2'} px-2 text-center text-slate-500 font-bold`}>{index + 1}</td>
                  <td className={`${isVeryCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} px-2`}>
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Type service details..."
                      className={`w-full outline-none text-slate-800 font-bold bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 ${isVeryCompact ? 'text-[10px] pb-0' : isCompact ? 'text-xs pb-0' : 'pb-0.5'} mb-1`}
                    />
                    <div className="print:hidden mt-1 bg-white rounded border border-slate-200">
                      <SearchableCategorySelect
                        groups={SERVICE_CATEGORY_GROUPS}
                        name=""
                        placeholder="Search service template..."
                        onChange={(val) => {
                          if (val) updateItem(item.id, 'description', val);
                        }}
                      />
                    </div>
                  </td>
                  <td className={`${isVeryCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} px-2 text-right align-top`}>
                    <input 
                      type="number" 
                      value={item.amount || ''} 
                      onChange={e => updateItem(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className={`w-full text-right outline-none text-slate-800 font-bold bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 ${isVeryCompact ? 'text-[10px] pb-0' : isCompact ? 'text-xs pb-0' : 'pb-0.5'}`}
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
        <div className={`flex justify-end text-sm ${isVeryCompact ? 'mb-2' : isCompact ? 'mb-4' : 'mb-6'}`}>
          <div className={`w-1/2 bg-slate-50 rounded-xl border border-slate-200 ${isVeryCompact ? 'p-2' : isCompact ? 'p-3' : 'p-4'}`}>
            <div className={`flex justify-between items-center text-slate-600 ${isVeryCompact ? 'mb-1 text-[10px]' : 'mb-2'}`}>
              <span>Subtotal:</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between items-center text-slate-600 border-b border-slate-200 ${isVeryCompact ? 'mb-1 pb-1 text-[10px]' : 'mb-2 pb-2'}`}>
              <span>Tax / Discount:</span>
              <span>-</span>
            </div>
            <div className={`flex justify-between items-center font-black text-slate-900 ${isVeryCompact ? 'mt-1 text-sm' : 'mt-2 text-lg'}`}>
              <span>Total Due:</span>
              <span className="text-amber-600">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bottom / Footer: Payment & Bank Details */}
        <div className={`mt-auto ${isVeryCompact ? 'pt-2' : isCompact ? 'pt-3' : 'pt-5'}`}>
          {/* Letterhead Account Details Box */}
          <div className={`border-2 border-amber-500 rounded-xl bg-amber-50/20 overflow-hidden ${isVeryCompact ? 'mb-2 p-2' : isCompact ? 'mb-2.5 p-2.5' : 'mb-3 p-3.5'}`}>
            <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 mb-2">
              <p className="font-black text-slate-900 uppercase tracking-widest text-[10px] sm:text-xs">
                Official Account & Payment Details
              </p>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Get Legal Solution
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white border border-amber-200/80 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                  Bank Account (UBL)
                </span>
                <p className="font-mono font-black text-slate-900 text-sm tracking-wider my-0.5">
                  PK27UNIL0109000315815522
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Account Title: <span className="font-bold text-slate-800">Get Legal Solution</span>
                </p>
              </div>

              <div className="bg-white border border-amber-200/80 rounded-lg p-2.5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                  Jazz Cash
                </span>
                <p className="font-mono font-black text-slate-900 text-sm tracking-wider my-0.5">
                  03010407809
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Account Title: <span className="font-bold text-slate-800">Pervaiz Malik</span>
                </p>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-amber-200/70 flex flex-wrap justify-between items-center text-[10px] text-slate-600">
              <span className="font-semibold italic text-slate-700">
                Please pay your bill and send screenshot as soon as possible.
              </span>
              <span className="font-bold text-slate-800">Regards, GLS AI Assistant</span>
            </div>
          </div>

          <div className={`text-center border-b border-slate-200 ${isVeryCompact ? 'pb-1 mb-1' : isCompact ? 'pb-1.5 mb-1.5' : 'pb-2 mb-2'}`}>
            <p className="font-bold text-slate-500 italic text-[10px]">This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
          
          <div className={`text-center text-slate-500 ${isVeryCompact ? 'text-[8px]' : 'text-[10px]'}`}>
            <p>Thank you for choosing Get Legal Solution. All payments are due within 15 days of invoice date.</p>
            <p className="mt-0.5">Please make cheques or online transfers payable to "Get Legal Solution".</p>
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
