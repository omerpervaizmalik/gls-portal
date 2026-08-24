"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Wallet, TrendingUp, TrendingDown, BookOpen, PieChart, FileText, ClipboardList } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function FamsLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isClient = session?.user?.role === 'CLIENT';

  return (
    <div className="flex h-screen overflow-hidden w-full print:h-auto print:overflow-visible print:block">
      <Sidebar />
      <div className="flex flex-col h-full bg-slate-50 flex-1 overflow-x-auto md:overflow-x-hidden print:h-auto print:overflow-visible print:block">
        {!isClient && (
          <header className="print:hidden bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 shrink-0 flex flex-col md:flex-row md:items-center shadow-sm w-full space-y-3 md:space-y-0">
            <div className="flex items-center">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-amber-500 mr-2 md:mr-3" />
              <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Financial Accounts</h1>
            </div>
            
            <nav className="md:ml-auto flex flex-wrap md:flex-nowrap gap-2 md:space-x-1 overflow-x-auto scrollbar-hide">
              <Link href="/fams" className="px-3 py-2 text-xs md:text-sm font-bold bg-slate-100 md:bg-transparent rounded-lg text-slate-700 hover:bg-slate-200 md:hover:bg-slate-100 hover:text-amber-600 transition-colors whitespace-nowrap">
                Dashboard
              </Link>
              <Link href="/fams/invoice" className="px-3 py-2 text-xs md:text-sm font-bold bg-slate-100 md:bg-transparent rounded-lg text-amber-600 hover:bg-slate-200 md:hover:bg-slate-100 transition-colors flex items-center whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Invoices
              </Link>
              <Link href="/fams/quote" className="px-3 py-2 text-xs md:text-sm font-bold bg-slate-100 md:bg-transparent rounded-lg text-blue-600 hover:bg-slate-200 md:hover:bg-slate-100 transition-colors flex items-center whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Quotations
              </Link>
              <Link href="/fams/income" className="px-3 py-2 text-xs md:text-sm font-bold bg-slate-100 md:bg-transparent rounded-lg text-emerald-600 hover:bg-slate-200 md:hover:bg-slate-100 transition-colors flex items-center whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Income Records
              </Link>
              <Link href="/fams/expenses" className="px-3 py-2 text-xs md:text-sm font-bold bg-slate-100 md:bg-transparent rounded-lg text-rose-600 hover:bg-slate-200 md:hover:bg-slate-100 transition-colors flex items-center whitespace-nowrap">
                <TrendingDown className="w-3.5 h-3.5 mr-1.5" /> Expense Records
              </Link>
              <Link href="/fams/ledger" className="px-3 py-2 text-xs md:text-sm font-bold bg-slate-100 md:bg-transparent rounded-lg text-blue-600 hover:bg-slate-200 md:hover:bg-slate-100 transition-colors flex items-center whitespace-nowrap">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Clients Ledger
              </Link>
              <Link href="/fams/reports" className="px-3 py-2 text-xs md:text-sm font-bold bg-slate-100 md:bg-transparent rounded-lg text-purple-600 hover:bg-slate-200 md:hover:bg-slate-100 transition-colors flex items-center whitespace-nowrap">
                <PieChart className="w-3.5 h-3.5 mr-1.5" /> Reports
              </Link>
            </nav>
          </header>
        )}
        
        <main className="flex-1 overflow-auto p-6 bg-slate-50 print:overflow-visible print:p-0 print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
