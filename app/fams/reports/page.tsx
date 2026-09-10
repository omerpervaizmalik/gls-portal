import React from "react";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES: Record<string, boolean> = {
  "Staff Salaries": true,
  "Office Rent": true,
  "Bar Council Fees": true,
  "Court Filing Charges": true,
  "Stationery & Printing": true,
  "Telephone & Internet": true,
  "Software Tools": true,
  "Accountant/Audit Fees": true,
  "Miscellaneous": true,
  "Personal Drawings": false,
  "Fines & Penalties": false,
  "Client Entertainment": false,
};

export default async function ReportsPage() {
  const expensesAgg = await prisma.expense.aggregate({ _sum: { amount: true } });
  const incomeAgg = await prisma.incomeRecord.aggregate({ _sum: { amount: true } });
  const totalExpenses = expensesAgg._sum.amount || 0;
  const totalIncome = incomeAgg._sum.amount || 0;
  const netProfit = totalIncome - totalExpenses;

  // Fetch all expenses to compute totals per category
  const allExpenses = await prisma.expense.findMany({
    select: { category: true, amount: true }
  });

  const categoryMap: Record<string, number> = {};
  for (const exp of allExpenses) {
    const cat = exp.category || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
  }

  const categoryTotals = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Fetch tax deductibility settings
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "tax_expense_categories" }
  });

  const savedMapping: Record<string, boolean> = (setting?.value as any) || {};
  const initialCategories: Record<string, boolean> = { ...DEFAULT_CATEGORIES, ...savedMapping };

  // Include any custom categories recorded in expenses
  for (const item of categoryTotals) {
    if (initialCategories[item.category] === undefined) {
      initialCategories[item.category] = true;
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ReportsClient
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netProfit={netProfit}
        categoryTotals={categoryTotals}
        initialCategories={initialCategories}
      />
    </div>
  );
}
