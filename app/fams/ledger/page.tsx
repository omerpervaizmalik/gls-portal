import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, User, ArrowRight } from "lucide-react";
import ClientSearchInput from "@/components/ClientSearchInput";

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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100">
          {filteredClients.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-500">
              No clients found.
            </div>
          ) : (
            filteredClients.map((client, index) => (
              <Link 
                href={`/fams/ledger/${client.id}`} 
                key={client.id}
                className={`p-6 hover:bg-slate-50 transition-colors group ${
                  index % 3 !== 2 && index !== filteredClients.length - 1 ? 'lg:border-r border-slate-100' : ''
                } ${index % 2 !== 1 && index !== filteredClients.length - 1 ? 'sm:border-r border-slate-100' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">{client.name}</h3>
                      <p className="text-xs text-slate-500">{client.cfNo}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Outstanding Balance</p>
                    <p className={`font-bold text-lg ${client.balance > 0 ? 'text-rose-600' : client.balance < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      Rs. {Math.abs(client.balance).toLocaleString()}
                      {client.balance > 0 && <span className="text-xs ml-1 font-normal text-rose-500">(Due)</span>}
                      {client.balance < 0 && <span className="text-xs ml-1 font-normal text-emerald-500">(Advance)</span>}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
