import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IncomeForm } from "./IncomeForm";

export const dynamic = "force-dynamic";

export default async function NewIncomePage() {
  const clients = await prisma.$queryRaw`
    SELECT id, name, "cfNo", "mobileNo" FROM "Client"
    ORDER BY CASE 
      WHEN "cfNo" ~ '^[0-9]+$' THEN CAST("cfNo" AS INTEGER) 
      WHEN "cfNo" ~ '^L-[0-9]+$' THEN 100000 + CAST(SUBSTRING("cfNo" FROM 3) AS INTEGER)
      ELSE 999999 
    END ASC, "cfNo" ASC
  ` as any[];

  // Fetch ledger entries to calculate outstanding balance for each client
  const ledgerEntries = await prisma.ledgerEntry.findMany({
    select: {
      clientId: true,
      type: true,
      amount: true
    }
  });

  const balanceMap = new Map<string, number>();
  for (const entry of ledgerEntries) {
    const current = balanceMap.get(entry.clientId) || 0;
    balanceMap.set(
      entry.clientId,
      entry.type === 'DEBIT' ? current + entry.amount : current - entry.amount
    );
  }

  const clientsWithBalance = clients.map(c => ({
    id: c.id,
    name: c.name,
    cfNo: c.cfNo,
    mobileNo: c.mobileNo,
    balance: balanceMap.get(c.id) || 0
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/fams/income" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Record Payment</h2>
          <p className="text-slate-500 mt-1">Record a payment received from a client.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <IncomeForm clients={clientsWithBalance} />
      </div>
    </div>
  );
}
