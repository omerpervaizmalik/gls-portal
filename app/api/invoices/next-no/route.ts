import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getNextInvoiceNumber } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const nextInvoiceNo = await getNextInvoiceNumber();
    return NextResponse.json({ nextInvoiceNo });
  } catch (error: any) {
    console.error("Error fetching next invoice number:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
