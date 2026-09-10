"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Printer
} from "lucide-react";
import TaxCategoryModal from "@/components/TaxCategoryModal";
import { useRouter } from "next/navigation";

interface CategorySummary {
  category: string;
  amount: number;
}

interface ReportsClientProps {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  categoryTotals: CategorySummary[];
  initialCategories: Record<string, boolean>;
}

export default function ReportsClient({
  totalIncome,
  totalExpenses,
  netProfit,
  categoryTotals,
  initialCategories,
}: ReportsClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>(initialCategories);

  // Compute live deductible vs non-deductible based on current categories state
  const totalDeductible = categoryTotals.reduce((sum, item) => {
    const isDeductible = categories[item.category] !== false; // defaults to true
    return isDeductible ? sum + item.amount : sum;
  }, 0);

  const totalNonDeductible = totalExpenses - totalDeductible;
  const taxableIncome = Math.max(0, totalIncome - totalDeductible);
  const deductiblePercent = totalExpenses > 0 ? Math.round((totalDeductible / totalExpenses) * 100) : 100;

  const handleSavedCategories = (updated: Record<string, boolean>) => {
    setCategories(updated);
    router.refresh();
  };

  const handleExportExcel = () => {
    // Generate clean CSV for accounting and FBR tax return prep
    const rows = [
      ["GET LEGAL SOLUTION - FINANCIAL & TAX DEDUCTIBILITY REPORT"],
      ["Generated Date", new Date().toLocaleDateString()],
      [],
      ["PROFIT & LOSS STATEMENT (YTD)"],
      ["Metric", "Amount (PKR)"],
      ["Total Revenue / Receipts", totalIncome.toFixed(2)],
      ["Total Operating Expenses", totalExpenses.toFixed(2)],
      ["Net Accounting Profit / (Loss)", netProfit.toFixed(2)],
      [],
      ["FBR TAX DEDUCTIBILITY SUMMARY"],
      ["Metric", "Amount (PKR)", "Status"],
      ["Total Deductible Expenses", totalDeductible.toFixed(2), "Allowable under Section 20"],
      ["Total Non-Deductible Expenses", totalNonDeductible.toFixed(2), "Inadmissible"],
      ["Estimated Taxable Income", taxableIncome.toFixed(2), "Subject to Tax"],
      [],
      ["EXPENSE BREAKDOWN BY CATEGORY"],
      ["Category", "Amount (PKR)", "Tax Classification"],
      ...categoryTotals.map((item) => [
        `"${item.category}"`,
        item.amount.toFixed(2),
        categories[item.category] !== false ? "Deductible" : "Non-Deductible",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GLS_Tax_Prep_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Top Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Tax Prep</h2>
          <p className="text-slate-500 mt-1">Generate financial summaries for accounting and FBR filing.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" /> Export PDF / Print
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel / CSV
          </button>
        </div>
      </div>

      {/* Grid: P&L Statement & Tax Deductibility Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Profit & Loss Statement */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <FileText className="w-5 h-5 text-amber-500 mr-2" />
              Profit & Loss Statement (YTD)
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              Accounting View
            </span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" /> Total Revenue
                </span>
                <span className="font-bold text-slate-800">Rs. {totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2 text-rose-500" /> Total Operating Expenses
                </span>
                <span className="font-bold text-slate-800">Rs. {totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-4 mt-4 bg-slate-50 rounded-lg px-4 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Net Accounting Profit</span>
                  <span className="text-xs text-slate-500">Revenue minus total incurred costs</span>
                </div>
                <span className={`text-xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  Rs. {netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5 flex-shrink-0" />
              Includes all firm receipts and verified operational expenses.
            </div>
          </div>
        </div>

        {/* Card 2: Connected Tax Deductibility Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <ShieldCheck className="w-5 h-5 text-amber-500 mr-2" />
              Tax Deductibility Summary
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center transition-colors print:hidden"
            >
              <Settings className="w-3.5 h-3.5 mr-1" /> Configure Categories
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
            <div>
              {/* Ratio Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Deductibility Ratio</span>
                  <span className="font-bold text-emerald-700">{deductiblePercent}% Tax Deductible</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${deductiblePercent}%` }}
                    title={`Deductible: Rs. ${totalDeductible.toLocaleString()}`}
                  />
                  <div
                    className="bg-rose-400 h-full transition-all duration-500"
                    style={{ width: `${100 - deductiblePercent}%` }}
                    title={`Non-Deductible: Rs. ${totalNonDeductible.toLocaleString()}`}
                  />
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-sm">
                  <span className="text-slate-600 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                    Deductible Expenses
                  </span>
                  <span className="font-semibold text-slate-800">Rs. {totalDeductible.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-sm">
                  <span className="text-slate-600 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-2" />
                    Non-Deductible Expenses
                  </span>
                  <span className="font-semibold text-slate-800">Rs. {totalNonDeductible.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-3 mt-2 bg-amber-50/60 rounded-lg px-4 border border-amber-200/60">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">Estimated Taxable Income</span>
                    <span className="text-[11px] text-amber-800">Revenue minus Allowable Deductions</span>
                  </div>
                  <span className="text-lg font-black text-amber-700">
                    Rs. {taxableIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status & Configure Link */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-1.5 flex-shrink-0" />
                <span>Tax Prep Ready for FBR return computation</span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline print:hidden"
              >
                Configure Categories &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Expense Tax Classifications Breakdown</h3>
            <p className="text-xs text-slate-500">Detailed list of all incurred expenses by tax status.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center print:hidden"
          >
            <Settings className="w-3.5 h-3.5 mr-1" /> Adjust Categories
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
              <tr>
                <th className="px-6 py-3 font-semibold">Expense Category</th>
                <th className="px-6 py-3 font-semibold">Tax Classification</th>
                <th className="px-6 py-3 font-semibold text-right">Total Amount (Rs)</th>
                <th className="px-6 py-3 font-semibold text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryTotals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No expense data recorded yet.
                  </td>
                </tr>
              ) : (
                categoryTotals.map((item) => {
                  const isDeductible = categories[item.category] !== false;
                  const pct = totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(1) : "0";
                  return (
                    <tr key={item.category} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-800">{item.category}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isDeductible
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isDeductible ? "Deductible" : "Non-Deductible"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-700">
                        {item.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500 text-xs">{pct}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <TaxCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onSaved={handleSavedCategories}
      />
    </>
  );
}
