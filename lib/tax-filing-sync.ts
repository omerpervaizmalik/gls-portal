import { prisma } from "@/lib/prisma";

/**
 * Helpers that keep the Tax Filing Record (Filing model) in sync with FAMS:
 *  - Creating an invoice for "Income Tax Return Filing" marks the client's filing as Billed.
 *  - Receiving a payment from the client marks the filing as Paid and, when the payment
 *    is partial, writes the outstanding balance into the filing notes.
 */

const PENDING_NOTE_REGEX = /\s*\|?\s*Pending Payment:\s*Rs\.?\s*[\d,]+(\.\d+)?/gi;

/** True when a service/item description refers to an income tax return filing. */
export function isIncomeTaxFilingText(text?: string | null): boolean {
  if (!text) return false;
  return /income\s*tax/i.test(text) && /(fil|return)/i.test(text);
}

/**
 * If ANY invoice line item is for Income Tax filing, the complete invoice total
 * (after discount) is counted as the Tax Filing bill amount. Otherwise returns 0.
 */
export function getIncomeTaxBillAmount(items: any, totalAmount: number): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const hasIncomeTaxLine = items.some((i: any) => isIncomeTaxFilingText(i?.description));
  if (!hasIncomeTaxLine) return 0;
  return Math.max(0, Number(totalAmount) || 0);
}

function formatRs(n: number) {
  return `Rs. ${Math.round(n).toLocaleString("en-US")}`;
}

function buildNotes(existing: string | null | undefined, pending: number): string {
  const base = (existing || "").replace(PENDING_NOTE_REGEX, "").trim();
  if (pending <= 0) return base;
  const tag = `Pending Payment: ${formatRs(pending)}`;
  return base ? `${base} | ${tag}` : tag;
}

async function addLog(filingId: string, note: string, stage: string, userName?: string | null) {
  try {
    await prisma.filingLog.create({
      data: { filingId, note, stage, type: "INTERNAL", userName: userName || "System" }
    });
  } catch (e) {
    console.error("Failed to add filing log", e);
  }
}

/** Latest-year filing for the client (the current tax year being worked on). */
async function getLatestFiling(clientId: string) {
  return prisma.filing.findFirst({
    where: { clientId },
    orderBy: { year: "desc" }
  });
}

/**
 * Marks the client's latest Tax Filing as Billed and adds `amountDelta` to its bill amount.
 * Use a negative/positive delta when an existing invoice is edited.
 */
export async function syncFilingBilled(
  clientId: string | null | undefined,
  amountDelta: number,
  opts: { invoiceNo?: string; userName?: string | null; onlyIfNotBilled?: boolean } = {}
) {
  if (!clientId) return;
  try {
    const filing = await getLatestFiling(clientId);
    if (!filing) return;
    if (opts.onlyIfNotBilled && filing.isBilled) return;

    const billAmount = Math.max(0, (filing.billAmount || 0) + amountDelta);
    const pending = filing.isPaid ? Math.max(0, billAmount - (filing.paymentAmount || 0)) : 0;

    await prisma.filing.update({
      where: { id: filing.id },
      data: {
        isBilled: true,
        billAmount,
        notes: filing.isPaid ? buildNotes(filing.notes, pending) : filing.notes
      }
    });

    if (!filing.isBilled || amountDelta !== 0) {
      await addLog(
        filing.id,
        `Auto-billed via invoice${opts.invoiceNo ? ` ${opts.invoiceNo}` : ""} (Bill: ${formatRs(billAmount)})`,
        "Billed",
        opts.userName
      );
    }
  } catch (e) {
    console.error("syncFilingBilled failed", e);
  }
}

/**
 * Applies a received payment to the client's outstanding (billed, not fully paid) Tax Filing.
 * Marks it Paid; if a balance remains, records "Pending Payment: Rs. X" in notes.
 * Returns the amount that was applied to the filing.
 */
export async function syncFilingPayment(
  clientId: string | null | undefined,
  amount: number,
  opts: { userName?: string | null } = {}
): Promise<number> {
  if (!clientId || !(amount > 0)) return 0;
  try {
    // Oldest outstanding billed filing first
    const candidates = await prisma.filing.findMany({
      where: { clientId, isBilled: true },
      orderBy: { year: "asc" }
    });
    const filing = candidates.find(f => (f.paymentAmount || 0) < (f.billAmount || 0) || (!f.isPaid && (f.billAmount || 0) === 0));
    if (!filing) return 0;

    const outstanding = Math.max(0, (filing.billAmount || 0) - (filing.paymentAmount || 0));
    // If bill amount is unknown (0), count the full payment
    const applied = outstanding > 0 ? Math.min(amount, outstanding) : amount;
    const paymentAmount = (filing.paymentAmount || 0) + applied;
    const pending = Math.max(0, (filing.billAmount || 0) - paymentAmount);

    await prisma.filing.update({
      where: { id: filing.id },
      data: {
        isPaid: true,
        paymentAmount,
        notes: buildNotes(filing.notes, pending)
      }
    });

    await addLog(
      filing.id,
      pending > 0
        ? `Partial payment received: ${formatRs(applied)} — Pending: ${formatRs(pending)}`
        : `Full payment received: ${formatRs(applied)}`,
      "Paid",
      opts.userName
    );
    return applied;
  } catch (e) {
    console.error("syncFilingPayment failed", e);
    return 0;
  }
}
