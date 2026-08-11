import React from "react";
import { prisma } from "@/lib/prisma";
import { TrendingUp, Filter, Plus, PieChart, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import DeleteIncomeButton from "@/components/DeleteIncomeButton";

export const dynamic = 'force-dynamic';

export default async function IncomeRegisterPage() {
  const incomeRecords = await prisma.incomeRecord.findMany({
    include: { client: true, invoice: true },
    orderBy: { date: 'desc' }
  });

  // Calculate totals by service type
  const serviceTotals = incomeRecords.reduce((acc, record) => {
    acc[record.serviceType] = (acc[record.serviceType] || 0) + record.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Income Register</h2>
          <p className="text-slate-500 mt-1">Consolidated view of all revenue by service type.</p>
        </div>
        <Link href="/fams/income/new" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-amber-500/20">
          <Plus className="w-4 h-4 mr-2" /> Record Income
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
              <PieChart className="w-5 h-5 text-amber-500 mr-2" />
              Revenue Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(serviceTotals).map(([service, total]) => (
                <div key={service}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{service}</span>
                    <span className="text-slate-800 font-bold">Rs. {total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min((total / Math.max(...Object.values(serviceTotals))) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
              {Object.keys(serviceTotals).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No income data yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Recent Receipts</h3>
            <button className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Service Type</th>
                  <th className="px-6 py-3 font-medium text-right">Amount (Rs)</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No income records found.
                    </td>
                  </tr>
                ) : (
                  incomeRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 flex items-center">
                        {record.client?.name || record.walkinName || "Walk-in / Unknown"}
                        {record.invoiceId && (
                           <Link href={`/fams/invoice/new?id=${record.invoiceId}`} className="ml-2 text-amber-500 hover:text-amber-600" title="View Invoice">
                             <FileText className="w-4 h-4" />
                           </Link>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {record.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">
                        + {record.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end space-x-3">
                        <DeleteIncomeButton id={record.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
