import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MODULES_MAP: Record<string, any> = {
  User: prisma.user,
  Client: prisma.client,
  Matter: prisma.matter,
  Task: prisma.task,
  Filing: prisma.filing,
  Invoice: prisma.invoice,
  LedgerEntry: prisma.ledgerEntry,
  TaskLog: prisma.taskLog,
  FilingLog: prisma.filingLog,
  Disbursement: prisma.disbursement,
  IncomeRecord: prisma.incomeRecord,
  UserProfile: prisma.userProfile,
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const moduleParam = searchParams.get("module");

    if (!moduleParam) {
      return NextResponse.json({ error: "Module parameter is required" }, { status: 400 });
    }

    let exportData: any = {};

    if (moduleParam === "ALL") {
      // Export all predefined modules
      for (const key of Object.keys(MODULES_MAP)) {
        try {
          const data = await MODULES_MAP[key].findMany();
          exportData[key] = data;
        } catch (e) {
          console.error(`Failed to export module ${key}`, e);
        }
      }
    } else {
      // Export specific module
      const dbModule = MODULES_MAP[moduleParam];
      if (!dbModule) {
        return NextResponse.json({ error: "Invalid module specified" }, { status: 400 });
      }
      const data = await dbModule.findMany();
      exportData[moduleParam] = data;
    }

    // Set headers for file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="backup_${moduleParam.toLowerCase()}_${Date.now()}.json"`,
        "Content-Type": "application/json",
      },
    });

  } catch (error: any) {
    console.error("Backup Export Error:", error);
    return NextResponse.json({ error: "Internal Server Error during export" }, { status: 500 });
  }
}
