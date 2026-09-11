import { prisma } from "@/lib/prisma";

/**
 * Scans all invoices in the database, extracts the highest numeric ID,
 * and returns the next sequential unique invoice number formatted as `INV-${maxNum + 1}`.
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    select: { invoiceNo: true }
  });

  let maxNum = 0;
  for (const inv of invoices) {
    if (!inv.invoiceNo) continue;
    const match = inv.invoiceNo.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum > 0 ? maxNum + 1 : 1;
  return `INV-${nextNum}`;
}
