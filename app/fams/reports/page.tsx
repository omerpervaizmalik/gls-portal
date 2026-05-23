import React from "react";
import { prisma } from "@/lib/prisma";
import { FileText, Download, TrendingUp, TrendingDown, FileSpreadsheet } from "lucide-react";

export default async function ReportsPage() {
  const expenses = await prisma.expense.aggregate({ _sum: { amount: true } });
  const income = await prisma.incomeRecord.aggregate({ _sum: { amount: true } });
  const totalExpenses = expenses._sum.amount || 0;
  const totalIncome = income._sum.amount || 0;
  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Tax Prep</h2>
          <p className="text-slate-500 mt-1">Generate financial summaries for accounting and FBR filing.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-emerald-600/20">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <FileText className="w-5 h-5 text-amber-500 mr-2" />
              Profit & Loss Statement (YTD)
            </h3>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-emerald-500"/> Total Revenue</span>
                <span className="font-bold text-slate-800">Rs. {totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 flex items-center"><TrendingDown className="w-4 h-4 mr-2 text-rose-500"/> Total Operating Expenses</span>
                <span className="font-bold text-slate-800">Rs. {totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-4 mt-4 bg-slate-50 rounded-lg px-4">
                <span className="font-bold text-slate-800">Net Profit</span>
                <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Rs. {netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <FileText className="w-5 h-5 text-amber-500 mr-2" />
              Tax Deductibility Summary
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
               <FileText className="w-8 h-8 text-amber-500" />
             </div>
             <h4 className="text-lg font-medium text-slate-800 mb-2">Tax Prep Ready</h4>
             <p className="text-sm text-slate-500 max-w-sm mb-6">Categorize your expenses as Deductible and Non-Deductible to automatically generate your FBR Income Tax Return summaries.</p>
             <button className="text-amber-600 font-medium hover:underline">Configure Categories</button>
          </div>
        </div>
      </div>
    </div>
  );
}
