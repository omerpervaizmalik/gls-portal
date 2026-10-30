import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { restoreBackupPayload } from "@/lib/backup-service";

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
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }

    const importedCount = await restoreBackupPayload(importData, moduleParam);

    return NextResponse.json({ success: true, count: importedCount }, { status: 200 });
  } catch (error: any) {
    console.error("Backup Import Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error during import" }, { status: 500 });
  }
}
