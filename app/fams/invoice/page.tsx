"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, FileText, Calendar, User, ArrowRight, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?q=${search}`);
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Invoice Management</h2>
          <p className="text-slate-500 mt-1">Track, search, and manage issued invoices.</p>
        </div>
        <Link href="/fams/invoice/new" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-amber-500/20">
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Invoice No or Client Name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Invoice No</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No invoices found.</td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{invoice.invoiceNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{invoice.client?.name}</span>
                        <span className="text-[10px] text-slate-400">{invoice.client?.cfNo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {format(new Date(invoice.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-lg">
                      Rs. {invoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        invoice.status === 'ISSUED' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {invoice.status === 'ISSUED' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end items-center space-x-3">
                      <Link 
                        href={`/fams/invoice/new?id=${invoice.id}`}
                        className="inline-flex items-center text-amber-600 hover:text-amber-700 font-bold"
                      >
                        Modify <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                      <DeleteInvoiceButton id={invoice.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
