import React from "react";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { revalidatePath } from "next/cache";
import CategorySelect from "@/components/CategorySelect";
import { ClientOrWalkinSelect } from "./ClientOrWalkinSelect";

export default async function NewIncomePage() {
  const clients = await prisma.$queryRaw`
    SELECT id, name, "cfNo" FROM "Client"
    ORDER BY CAST("cfNo" AS INTEGER) ASC
  ` as any[];

  async function createIncome(formData: FormData) {
    "use server";
    
    const amountStr = formData.get('amount') as string;
    const serviceType = formData.get('serviceType') as string;
    const dateStr = formData.get('date') as string;
    const clientId = formData.get('clientId') as string;
    const description = formData.get('description') as string;
    const walkinName = formData.get('walkinName') as string;

    if (!amountStr || !serviceType || !dateStr) {
      throw new Error("Missing required fields");
    }

    const amount = parseFloat(amountStr);
    const date = new Date(dateStr);

    // 1. Generate an Invoice first
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    const lastInvoiceNo = lastInvoice?.invoiceNo || "INV-000000";
    const nextInvoiceNumber = (parseInt(lastInvoiceNo.split("-")[1] || "0") + 1).toString().padStart(6, '0');
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: `INV-${nextInvoiceNumber}`,
        clientId: clientId || null,
        walkinName: (!clientId && walkinName) ? walkinName : null,
        date,
        totalAmount: amount,
        items: [{ description: serviceType, amount }],
        status: "ISSUED"
      }
    });

    // 2. Create the Income Record for the firm's consolidated view
    await prisma.incomeRecord.create({
      data: {
        amount,
        serviceType,
        date,
        clientId: clientId || null,
        walkinName: (!clientId && walkinName) ? walkinName : null,
        invoiceId: invoice.id
      }
    });

    // 2. If a client is selected, we MUST also record this in their ledger as a CREDIT (Payment)
    if (clientId) {
      await prisma.ledgerEntry.create({
        data: {
          clientId,
          type: 'CREDIT',
          amount,
          date,
          description: description || `Payment for ${serviceType}`
        }
      });
    }

    revalidatePath("/fams");
    revalidatePath("/fams/income");
    redirect("/fams/income");
  }

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
        <form action={createIncome} className="p-6 space-y-6">
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
            
            <ClientOrWalkinSelect clients={clients} />

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Amount Received (Rs) *</label>
              <input 
                type="number" 
                id="amount" 
                name="amount" 
                required 
                min="0"
                step="0.01"
                placeholder="e.g. 15000"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <CategorySelect 
              name="serviceType" 
              label="Service Type" 
              options={[
                "Income Tax",
                "Sales Tax",
                "Company Registration",
                "Corporate Law",
                "IPO",
                "Litigation",
                "General Consultation"
              ]} 
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                id="description" 
                name="description" 
                rows={2}
                placeholder="Details of the payment..."
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4 mr-2" /> Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
