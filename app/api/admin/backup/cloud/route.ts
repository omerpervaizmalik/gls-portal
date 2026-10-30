import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onedrive } from "@/lib/onedrive";
import {
  BACKUP_ONEDRIVE_FOLDER,
  BACKUP_META_SETTING_KEY,
  AUTO_BACKUP_INTERVAL_MS,
  createOneDriveRestorePoint,
  restoreBackupPayload,
} from "@/lib/backup-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isCron = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

    // Allow Vercel Cron to trigger an automatic backup via GET ?cron=1
    if (searchParams.get("cron") === "1" || isCron) {
      const meta = await createOneDriveRestorePoint("CRON");
      return NextResponse.json({ success: true, created: true, meta });
    }

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: BACKUP_META_SETTING_KEY },
    });
    const meta: any = setting?.value || null;

    // Silent background check from GlobalActivityTracker: only create if > 24h old
    if (searchParams.get("check") === "1") {
      const lastTime = meta?.lastBackupAt ? new Date(meta.lastBackupAt).getTime() : 0;
      const due = Date.now() - lastTime >= AUTO_BACKUP_INTERVAL_MS;
      if (!due) {
        return NextResponse.json({ success: true, created: false, meta });
      }
      const newMeta = await createOneDriveRestorePoint("AUTO");
      return NextResponse.json({ success: true, created: true, meta: newMeta });
    }

    // List all restore point files from OneDrive `Malik Law Associates/Portal Backups`
    let files: any[] = [];
    let folderError: string | null = null;
    try {
      const items = await onedrive.listFolder(BACKUP_ONEDRIVE_FOLDER);
      files = items
        .filter((i: any) => i.file && i.name?.endsWith(".json"))
        .sort(
          (a: any, b: any) =>
            new Date(b.lastModifiedDateTime).getTime() - new Date(a.lastModifiedDateTime).getTime()
        );
    } catch (err: any) {
      // If folder doesn't exist yet on OneDrive, return empty list cleanly
      if (!String(err?.message || "").includes("itemNotFound")) {
        folderError = err?.message || "Failed to list OneDrive backup folder";
      }
    }

    return NextResponse.json({
      folder: BACKUP_ONEDRIVE_FOLDER,
      meta,
      files,
      folderError,
    });
  } catch (error: any) {
    console.error("Cloud Backup GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to check cloud backups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "CREATE";

    if (action === "CREATE") {
      const meta = await createOneDriveRestorePoint("MANUAL");
      return NextResponse.json({ success: true, meta });
    }

    if (action === "RESTORE") {
      const { fileId } = body;
      if (!fileId) {
        return NextResponse.json({ error: "fileId is required to restore from OneDrive" }, { status: 400 });
      }
      const buffer = await onedrive.getFileContent(fileId);
      const text = Buffer.from(buffer).toString("utf8");
      const importData = JSON.parse(text);
      const count = await restoreBackupPayload(importData, "ALL");
      return NextResponse.json({ success: true, count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Cloud Backup POST Error:", error);
    return NextResponse.json({ error: error.message || "Cloud backup operation failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    await onedrive.deleteItem(fileId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cloud Backup DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete cloud restore point" }, { status: 500 });
  }
}
