"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function QuotationListPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, [search]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations?q=${search}`);
      const data = await res.json();
      setQuotations(data);
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
          <h2 className="text-2xl font-bold text-slate-800">Quotation Management</h2>
          <p className="text-slate-500 mt-1">Track, search, and manage issued quotations.</p>
        </div>
        <Link href="/fams/quote/new" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-amber-500/20">
          <Plus className="w-4 h-4 mr-2" /> New Quotation
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Client Name..." 
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
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading quotations...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No quotations found.</td>
                </tr>
              ) : (
                quotations.map(quote => (
                  <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{quote.client?.name}</span>
                        <span className="text-[10px] text-slate-400">{quote.client?.cfNo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {format(new Date(quote.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-lg">
                      Rs. {quote.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/fams/quote/new?id=${quote.id}`}
                        className="inline-flex items-center text-amber-600 hover:text-amber-700 font-bold"
                      >
                        Modify <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
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
