import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getNextInvoiceNumber } from "@/lib/invoices";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { amount, serviceType, paymentMode, date, clientId, description, walkinName } = await req.json();

    if (!amount || !serviceType || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    const dateObj = new Date(date);

    // 1. Generate unique invoice number
    const invoiceNo = await getNextInvoiceNumber();

    // 2. Create Invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId: clientId || null,
        walkinName: (!clientId && walkinName) ? walkinName : null,
        date: dateObj,
        totalAmount: numericAmount,
        items: [{ description: serviceType, amount: numericAmount }],
        status: "ISSUED"
      }
    });

    // 3. Create Income Record
    const incomeRecord = await prisma.incomeRecord.create({
      data: {
        amount: numericAmount,
        serviceType,
        paymentMode: paymentMode || null,
        date: dateObj,
        clientId: clientId || null,
        walkinName: (!clientId && walkinName) ? walkinName : null,
        invoiceId: invoice.id
      }
    });

    // 4. If client is selected, record credit in ledger and compute updated balance
    let client = null;
    let updatedBalance: number | null = null;

    if (clientId) {
      await prisma.ledgerEntry.create({
        data: {
          clientId,
          type: "CREDIT",
          amount: numericAmount,
          date: dateObj,
          description: description || `Payment for ${serviceType} (Inv #${invoiceNo})`,
          paymentMode: paymentMode || null
        }
      });

      client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          cfNo: true,
          mobileNo: true
        }
      });

      const clientLedgers = await prisma.ledgerEntry.findMany({
        where: { clientId },
        select: { type: true, amount: true }
      });

      updatedBalance = clientLedgers.reduce((acc, entry) => {
        return entry.type === "DEBIT" ? acc + entry.amount : acc - entry.amount;
      }, 0);
    }

    revalidatePath("/fams");
    revalidatePath("/fams/income");
    revalidatePath("/fams/ledger");
    if (clientId) {
      revalidatePath(`/fams/ledger/${clientId}`);
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      incomeId: incomeRecord.id,
      amount: numericAmount,
      serviceType,
      paymentMode,
      date,
      description,
      client,
      updatedBalance
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
