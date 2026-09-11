import React from "react";
import { prisma } from "@/lib/prisma";
import { BookOpen } from "lucide-react";
import ClientSearchInput from "@/components/ClientSearchInput";
import { LedgerClientList } from "./LedgerClientList";

export const dynamic = 'force-dynamic';

export default async function LedgerIndexPage({ searchParams }: { searchParams: { q?: string, type?: string } }) {
  const q = searchParams.q?.toLowerCase() || "";
  const type = searchParams.type === 'LEGAL' ? 'LEGAL' : 'TAX';

  // Fetch clients and calculate their balances based on ledger entries
  // Fetch clients sorted by CF No numerically
  let clientsResults;
  if (type === 'LEGAL') {
    clientsResults = await prisma.$queryRaw`
      SELECT * FROM "Client"
      WHERE "clientType" = 'LEGAL'
      ORDER BY CASE WHEN "cfNo" ~ '^L-[0-9]+$' THEN CAST(SUBSTRING("cfNo" FROM 3) AS INTEGER) ELSE 999999 END ASC, "cfNo" ASC
    `;
  } else {
    clientsResults = await prisma.$queryRaw`
      SELECT * FROM "Client"
      WHERE "clientType" = 'TAX' OR "clientType" IS NULL
      ORDER BY CASE WHEN "cfNo" ~ '^[0-9]+$' THEN CAST("cfNo" AS INTEGER) ELSE 999999 END ASC, "cfNo" ASC
    `;
  }
  
  // Fetch all ledger entries
  const ledgerEntries = await prisma.ledgerEntry.findMany();

  const clientsWithBalance = (clientsResults as any[]).map(c => {
    const entries = ledgerEntries.filter(e => e.clientId === c.id);
    const balance = entries.reduce((acc, entry) => {
      return entry.type === 'DEBIT' ? acc + entry.amount : acc - entry.amount;
    }, 0);
    return { ...c, balance };
  });

  const filteredClients = clientsWithBalance.filter(c => 
    c.name.toLowerCase().includes(q) || (c.cfNo && c.cfNo.toLowerCase().includes(q))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Client Ledgers</h2>
          <p className="text-slate-500 mt-1">Manage individual client accounts, invoices, and payments.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <a 
          href="/fams/ledger?type=TAX"
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            type === 'TAX' 
              ? 'bg-slate-800 text-white shadow-lg' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tax Clients
        </a>
        <a 
          href="/fams/ledger?type=LEGAL"
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            type === 'LEGAL' 
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Legal Clients
        </a>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <ClientSearchInput defaultValue={q} />
        </div>
        
        <LedgerClientList clients={filteredClients} />
      </div>
    </div>
  );
}
