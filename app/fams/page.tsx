import React from "react";
import { prisma } from "@/lib/prisma";
import { TrendingUp, TrendingDown, BookOpen, AlertCircle, Plus, FileText, Wallet } from "lucide-react";
import Link from "next/link";
import MonthFilter from "@/components/MonthFilter";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function FamsDashboard({ searchParams }: { searchParams: { month?: string } }) {
  const currentMonthValue = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = searchParams.month || currentMonthValue;

  let dateFilter = {};
  let previousDateFilter = {};
  
  if (selectedMonth !== 'all') {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    
    dateFilter = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    previousDateFilter = {
      date: {
        lt: startDate
      }
    };
  }

  // Calculate current month stats
  const expenses = await prisma.expense.aggregate({ 
    _sum: { amount: true },
    where: dateFilter 
  });
  const income = await prisma.incomeRecord.aggregate({ 
    _sum: { amount: true },
    where: dateFilter 
  });
  
  const totalExpenses = expenses._sum.amount || 0;
  const totalIncome = income._sum.amount || 0;
  const netBalance = totalIncome - totalExpenses;

  // Calculate Opening Balance (previous months)
  let openingBalance = 0;
  if (selectedMonth !== 'all') {
    const prevExpenses = await prisma.expense.aggregate({ 
      _sum: { amount: true },
      where: previousDateFilter 
    });
    const prevIncome = await prisma.incomeRecord.aggregate({ 
      _sum: { amount: true },
      where: previousDateFilter 
    });
    openingBalance = (prevIncome._sum.amount || 0) - (prevExpenses._sum.amount || 0);
  }

  // Fetch clients with negative balances, sorted by CF No
  const results = await prisma.$queryRaw`
    SELECT * FROM "Client"
    ORDER BY CAST("cfNo" AS INTEGER) ASC
  `;
  
  // Since we need ledger entries, we'll fetch them for these clients
  const clientIds = (results as any[]).map(c => c.id);
  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: { clientId: { in: clientIds } }
  });

  const clientsWithBalance = (results as any[]).map(c => {
    const entries = ledgerEntries.filter(e => e.clientId === c.id);
    const balance = entries.reduce((acc, entry) => {
      return entry.type === 'DEBIT' ? acc - entry.amount : acc + entry.amount;
    }, 0);
    return { ...c, balance };
  }).filter(c => c.balance < 0).slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 whitespace-nowrap md:whitespace-normal">Command Center</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 whitespace-nowrap md:whitespace-normal">Overview of your firm's financial health.</p>
        </div>
        <div className="flex items-center space-x-3">
          <MonthFilter />
        </div>
      </div>

      {selectedMonth !== 'all' && (
        <div className="bg-slate-800 p-4 rounded-xl shadow-md border border-slate-700 flex justify-between items-center text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Opening Balance</p>
              <p className="text-sm text-slate-300">Carried forward from previous months</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${openingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rs. {openingBalance.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <p className="text-sm font-medium text-slate-500">Total Income</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2 flex items-center">
              Rs. {totalIncome.toLocaleString()}
            </h3>
            <div className="flex items-center mt-4 text-emerald-600 bg-emerald-50 w-max px-2 py-1 rounded text-xs font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              {selectedMonth === 'all' ? 'All time' : 'This month'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <p className="text-sm font-medium text-slate-500">Total Expenses</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2 flex items-center">
              Rs. {totalExpenses.toLocaleString()}
            </h3>
            <div className="flex items-center mt-4 text-rose-600 bg-rose-50 w-max px-2 py-1 rounded text-xs font-medium">
              <TrendingDown className="w-3 h-3 mr-1" />
              {selectedMonth === 'all' ? 'All time' : 'This month'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-bl-full -mr-16 -mt-16"></div>
          <div className="relative">
            <p className="text-sm font-medium text-slate-400">Net Balance</p>
            <h3 className="text-3xl font-bold text-white mt-2 flex items-center">
              Rs. {netBalance.toLocaleString()}
            </h3>
            <div className="flex items-center mt-4 text-slate-300 text-xs font-medium">
              {selectedMonth === 'all' ? 'Profit / Loss overview' : 'Monthly performance'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3">
        <Link href="/fams/invoice/new" className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors flex items-center justify-center shadow-md shadow-emerald-500/20 whitespace-nowrap">
          <FileText className="w-4 h-4 mr-1.5 md:mr-2" /> Invoice
        </Link>
        <Link href="/fams/quote/new" className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors flex items-center justify-center shadow-md shadow-blue-500/20 whitespace-nowrap">
          <FileText className="w-4 h-4 mr-1.5 md:mr-2" /> Quote
        </Link>
        <Link href="/fams/expenses/new" className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors flex items-center justify-center shadow-sm whitespace-nowrap">
          <Plus className="w-4 h-4 mr-1.5 md:mr-2" /> Expense
        </Link>
        <Link href="/fams/income/new" className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors flex items-center justify-center shadow-md shadow-amber-500/20 whitespace-nowrap">
          <Plus className="w-4 h-4 mr-1.5 md:mr-2" /> Payment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
              Pending Dues
            </h3>
            <Link href="/fams/ledger" className="text-sm text-amber-600 hover:text-amber-700 font-medium">View All</Link>
          </div>
          <div className="p-0 flex-1">
            {clientsWithBalance.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-slate-300" />
                </div>
                <p>No clients with pending dues.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {clientsWithBalance.map((client) => (
                  <li key={client.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.cfNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">Rs. {Math.abs(client.balance).toLocaleString()}</p>
                      <Link href={`/fams/ledger/${client.id}`} className="text-xs text-amber-600 hover:underline">View Ledger</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <TrendingDown className="w-5 h-5 text-amber-500 mr-2" />
              Recent Expenses
            </h3>
          </div>
          <div className="p-0 flex-1 flex items-center justify-center">
            <div className="p-8 text-center text-slate-500">
               <p className="text-sm">View all expenses in the Expenses tab.</p>
               <Link href="/fams/expenses" className="text-amber-600 text-xs font-medium mt-2 inline-block">Go to Expenses &rarr;</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
