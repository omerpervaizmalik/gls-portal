import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, items, totalAmount, date, status } = await req.json();

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { ledgerEntry: true }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update Invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        items: items || existingInvoice.items,
        totalAmount: totalAmount || existingInvoice.totalAmount,
        date: date ? new Date(date) : existingInvoice.date,
        status: status || existingInvoice.status
      }
    });

    // Update corresponding Ledger Entry if it exists
    if (existingInvoice.ledgerEntryId) {
      const summary = Array.isArray(items) ? items.map((i: any) => i.description || 'Service').join(', ') : '';
      const ledgerDescription = `Invoice ${existingInvoice.invoiceNo}: ${summary}`;

      await prisma.ledgerEntry.update({
        where: { id: existingInvoice.ledgerEntryId },
        data: {
          amount: totalAmount || existingInvoice.totalAmount,
          date: date ? new Date(date) : existingInvoice.date,
          description: ledgerDescription || existingInvoice.ledgerEntry?.description
        }
      });
    }

    revalidatePath("/fams");
    revalidatePath(`/fams/ledger/${existingInvoice.clientId}`);
    revalidatePath("/fams/invoice");

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Cancel Invoice (Delete Ledger Entry but keep Invoice record marked as CANCELLED)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Delete the ledger entry if it exists to reverse the debit
    if (invoice.ledgerEntryId) {
      await prisma.ledgerEntry.delete({
        where: { id: invoice.ledgerEntryId }
      });
    }

    // Mark invoice as cancelled instead of deleting it (audit trail)
    const cancelledInvoice = await prisma.invoice.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        ledgerEntryId: null // Clear link since it's deleted
      }
    });

    revalidatePath("/fams");
    revalidatePath(`/fams/ledger/${invoice.clientId}`);
    revalidatePath("/fams/invoice");

    return NextResponse.json(cancelledInvoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
