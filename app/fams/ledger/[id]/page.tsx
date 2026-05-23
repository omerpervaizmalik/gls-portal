import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Download, Printer, Folder } from "lucide-react";
import { format } from "date-fns";
import { LedgerControls } from "../LedgerControls";
import { EntryActions } from "../EntryActions";

export default async function ClientLedgerPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      ledgerEntries: {
        orderBy: { date: 'asc' }
      },
      disbursements: {
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!client) return notFound();

  let runningBalance = 0;
  const entriesWithBalance = client.ledgerEntries.map(entry => {
    if (entry.type === 'DEBIT') runningBalance += entry.amount;
    else runningBalance -= entry.amount;
    return { ...entry, runningBalance };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4 overflow-x-auto md:overflow-x-visible scrollbar-hide pb-2 md:pb-0">
          <Link href="/fams/ledger" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="shrink-0">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 whitespace-nowrap md:whitespace-normal">{client.name}'s Ledger</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 whitespace-nowrap md:whitespace-normal">CF No: {client.cfNo}</p>
          </div>
        </div>
        <div className="overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <LedgerControls clientId={client.id} clientName={client.name} cfNo={client.cfNo} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-4">Account Statement</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-lg">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right text-rose-600">Debit (Owes)</th>
                  <th className="px-4 py-3 font-medium text-right text-emerald-600">Credit (Paid)</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                  <th className="px-4 py-3 font-medium text-right rounded-r-lg print:hidden w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entriesWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  entriesWithBalance.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {format(new Date(entry.date), 'dd MMM, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {entry.description}
                        {entry.paymentMode && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            via {entry.paymentMode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        {entry.type === 'DEBIT' ? entry.amount.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {entry.type === 'CREDIT' ? entry.amount.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        {entry.runningBalance.toLocaleString()}
                      </td>
                      <td className="px-2 py-3 text-right print:hidden">
                        <EntryActions entry={entry} clientId={client.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">Current Balance:</td>
                  <td colSpan={4} className={`px-4 py-3 text-right ${runningBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    Rs. {runningBalance.toLocaleString()} {runningBalance > 0 ? '(Due)' : ''}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg text-white">
            <p className="text-sm font-medium text-slate-400">Total Outstanding</p>
            <h3 className="text-3xl font-bold mt-2">Rs. {runningBalance > 0 ? runningBalance.toLocaleString() : '0'}</h3>
            {runningBalance <= 0 && <p className="text-emerald-400 text-xs mt-2">Account is settled or in advance.</p>}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-semibold text-slate-800">Disbursement Log</h3>
              <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">Add</button>
            </div>
            
            <div className="space-y-4">
              {client.disbursements.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No out-of-pocket expenses.</p>
              ) : (
                client.disbursements.map(disb => (
                  <div key={disb.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{disb.description}</p>
                      <p className="text-xs text-slate-500">{format(new Date(disb.date), 'dd MMM, yy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">Rs. {disb.amount.toLocaleString()}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${disb.status === 'PENDING' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {disb.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
