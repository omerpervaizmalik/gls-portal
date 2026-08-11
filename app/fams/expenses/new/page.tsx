import React from "react";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { revalidatePath } from "next/cache";
import CategorySelect from "@/components/CategorySelect";

export default function NewExpensePage() {
  async function createExpense(formData: FormData) {
    "use server";
    
    const amountStr = formData.get('amount') as string;
    const category = formData.get('category') as string;
    const note = formData.get('note') as string;
    const dateStr = formData.get('date') as string;

    if (!amountStr || !category || !dateStr) {
      throw new Error("Missing required fields");
    }

    await prisma.expense.create({
      data: {
        amount: parseFloat(amountStr),
        category,
        note,
        date: new Date(dateStr)
      }
    });

    revalidatePath("/fams");
    revalidatePath("/fams/expenses");
    redirect("/fams/expenses");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/fams/expenses" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Add New Expense</h2>
          <p className="text-slate-500 mt-1">Record a firm operational cost.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <form action={createExpense} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input 
                type="date" 
                id="date" 
                name="date" 
                required 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs) *</label>
              <input 
                type="number" 
                id="amount" 
                name="amount" 
                required 
                min="0"
                step="0.01"
                placeholder="e.g. 5000"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <CategorySelect 
              name="category" 
              label="Category" 
              options={[
                "Staff Salaries",
                "Office Rent",
                "Bar Council Fees",
                "Court Filing Charges",
                "Stationery & Printing",
                "Telephone & Internet",
                "Software Tools",
                "Accountant/Audit Fees",
                "Miscellaneous"
              ]} 
            />

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
              <textarea 
                id="note" 
                name="note" 
                rows={3}
                placeholder="Additional details about this expense..."
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4 mr-2" /> Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
