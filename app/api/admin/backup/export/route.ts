import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BACKUP_MODULES_MAP, generateBackupPayload } from "@/lib/backup-service";

export const dynamic = "force-dynamic";

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

    if (moduleParam === "STATS") {
      const counts: Record<string, number> = {};
      await Promise.all(
        Object.keys(BACKUP_MODULES_MAP).map(async (key) => {
          try {
            counts[key] = await BACKUP_MODULES_MAP[key].count();
          } catch {
            counts[key] = 0;
          }
        })
      );
      return NextResponse.json({ counts });
    }

    const exportData = await generateBackupPayload(moduleParam);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="backup_${moduleParam.toLowerCase()}_${Date.now()}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Backup Export Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error during export" }, { status: 500 });
  }
}
