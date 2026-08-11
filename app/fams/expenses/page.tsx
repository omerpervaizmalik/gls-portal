import React from "react";
import { prisma } from "@/lib/prisma";
import { Plus, Search, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import DeleteExpenseButton from "@/components/DeleteExpenseButton";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Expense Management</h2>
          <p className="text-slate-500 mt-1">Track and manage your firm's operational costs.</p>
        </div>
        <Link href="/fams/expenses/new" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-md shadow-amber-500/20">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter className="w-4 h-4 mr-2" /> Category
            </button>
            <button className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Calendar className="w-4 h-4 mr-2" /> Date
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Note</th>
                <th className="px-6 py-3 font-medium text-right">Amount (Rs)</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      {expense.note || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-rose-600">
                      {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DeleteExpenseButton id={expense.id} />
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
