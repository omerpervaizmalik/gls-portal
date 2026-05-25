import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const moduleParam = formData.get("module") as string;

    if (!file || !moduleParam) {
      return NextResponse.json({ error: "File and module parameters are required" }, { status: 400 });
    }

    const text = await file.text();
    let importData: any;
    try {
      importData = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }

    let importedCount = 0;

    if (moduleParam === "ALL") {
      // Import all predefined modules from the JSON
      for (const key of Object.keys(importData)) {
        if (MODULES_MAP[key] && Array.isArray(importData[key])) {
          for (const item of importData[key]) {
            try {
              if (item.id) {
                // Remove undefined or unsupported nested relations before upserting if necessary
                await MODULES_MAP[key].upsert({
                  where: { id: item.id },
                  update: item,
                  create: item,
                });
                importedCount++;
              }
            } catch (e) {
              console.error(`Failed to import item into ${key}`, e);
            }
          }
        }
      }
    } else {
      // Import specific module
      const dbModule = MODULES_MAP[moduleParam];
      if (!dbModule) {
        return NextResponse.json({ error: "Invalid module specified" }, { status: 400 });
      }

      const dataArray = importData[moduleParam] || importData;
      if (!Array.isArray(dataArray)) {
         return NextResponse.json({ error: "JSON data must be an array" }, { status: 400 });
      }

      for (const item of dataArray) {
        try {
          if (item.id) {
             await dbModule.upsert({
               where: { id: item.id },
               update: item,
               create: item,
             });
             importedCount++;
          } else {
             await dbModule.create({
               data: item
             });
             importedCount++;
          }
        } catch (e) {
          console.error(`Failed to import item into ${moduleParam}`, e);
        }
      }
    }

    return NextResponse.json({ success: true, count: importedCount }, { status: 200 });

  } catch (error: any) {
    console.error("Backup Import Error:", error);
    return NextResponse.json({ error: "Internal Server Error during import" }, { status: 500 });
  }
}
