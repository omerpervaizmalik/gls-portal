import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SETTING_KEY = "tax_expense_categories";

const DEFAULT_CATEGORIES: Record<string, boolean> = {
  "Staff Salaries": true,
  "Office Rent": true,
  "Bar Council Fees": true,
  "Court Filing Charges": true,
  "Stationery & Printing": true,
  "Telephone & Internet": true,
  "Software Tools": true,
  "Accountant/Audit Fees": true,
  "Miscellaneous": true,
  "Personal Drawings": false,
  "Fines & Penalties": false,
  "Client Entertainment": false,
};

export async function GET() {
  try {
    const savedSetting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const savedMapping: Record<string, boolean> = (savedSetting?.value as any) || {};

    const expenses = await prisma.expense.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    const mergedMapping: Record<string, boolean> = { ...DEFAULT_CATEGORIES, ...savedMapping };

    for (const exp of expenses) {
      if (exp.category && mergedMapping[exp.category] === undefined) {
        mergedMapping[exp.category] = true;
      }
    }

    return NextResponse.json({
      success: true,
      categories: mergedMapping,
    });
  } catch (error: any) {
    console.error("Failed to fetch tax categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categories } = body;

    if (!categories || typeof categories !== "object") {
      return NextResponse.json({ error: "Invalid categories payload" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: categories },
      create: {
        key: SETTING_KEY,
        value: categories,
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Failed to save tax categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
