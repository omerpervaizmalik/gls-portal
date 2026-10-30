import { prisma } from "@/lib/prisma";
import { onedrive } from "@/lib/onedrive";

export const BACKUP_ONEDRIVE_FOLDER = "Malik Law Associates/Portal Backups";
export const BACKUP_META_SETTING_KEY = "onedrive_auto_backup_meta";
export const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_CLOUD_BACKUPS_TO_KEEP = 30;

// Dependency-ordered module list (parent -> child)
export const BACKUP_MODULE_ORDER = [
  "User",
  "UserProfile",
  "Permission",
  "Notification",
  "Client",
  "Matter",
  "Task",
  "TaskAttachment",
  "TaskLog",
  "Reminder",
  "Filing",
  "FilingLog",
  "LedgerEntry",
  "Invoice",
  "IncomeRecord",
  "Quotation",
  "Disbursement",
  "Expense",
  "FiscalYear",
  "SystemSetting",
  "ActivityLog",
] as const;

export const BACKUP_MODULES_MAP: Record<string, any> = {
  User: prisma.user,
  UserProfile: prisma.userProfile,
  Permission: prisma.permission,
  Notification: prisma.notification,
  Client: prisma.client,
  Matter: prisma.matter,
  Task: prisma.task,
  TaskAttachment: prisma.taskAttachment,
  TaskLog: prisma.taskLog,
  Reminder: prisma.reminder,
  Filing: prisma.filing,
  FilingLog: prisma.filingLog,
  LedgerEntry: prisma.ledgerEntry,
  Invoice: prisma.invoice,
  IncomeRecord: prisma.incomeRecord,
  Quotation: prisma.quotation,
  Disbursement: prisma.disbursement,
  Expense: prisma.expense,
  FiscalYear: prisma.fiscalYear,
  SystemSetting: prisma.systemSetting,
  ActivityLog: prisma.activityLog,
};

export const BACKUP_MODULE_COMPANIONS: Record<string, string[]> = {
  User: ["UserProfile", "Permission", "Notification"],
  Task: ["TaskAttachment", "TaskLog", "Reminder"],
  Filing: ["FilingLog"],
};

const RELATION_KEYS_BY_MODULE: Record<string, string[]> = {
  User: ["permissions", "logs", "profile", "assignedTasks", "createdTasks", "taskLogs", "reminders", "notifications"],
  UserProfile: ["user"],
  Permission: ["user"],
  Notification: ["user"],
  Client: ["filings", "ledgerEntries", "disbursements", "incomeRecords", "invoices", "quotations", "matters", "isPrivileged"],
  Matter: ["client", "tasks"],
  Task: ["matter", "assignedTo", "createdBy", "attachments", "logs", "reminders"],
  TaskAttachment: ["task"],
  TaskLog: ["task", "user"],
  Reminder: ["task", "user"],
  Filing: ["client", "logs"],
  FilingLog: ["filing"],
  LedgerEntry: ["client", "invoice"],
  Invoice: ["client", "ledgerEntry", "incomeRecord"],
  IncomeRecord: ["client", "invoice"],
  Quotation: ["client"],
  Disbursement: ["client"],
};

export async function fetchModuleData(key: string) {
  if (key === "Client") {
    await prisma
      .$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isPrivileged" BOOLEAN NOT NULL DEFAULT false;`)
      .catch(() => {});
    const clients = await prisma.client.findMany();
    const extras = await prisma
      .$queryRawUnsafe<{ id: string; isPrivileged: boolean; description?: string; category?: string }[]>(
        `SELECT id, "isPrivileged", description, category FROM "Client"`
      )
      .catch(() => []);
    const extraMap = new Map(extras.map((r) => [r.id, r]));
    return clients.map((c: any) => {
      const ex = extraMap.get(c.id);
      return {
        ...c,
        isPrivileged: ex ? !!ex.isPrivileged : !!c.isPrivileged,
        description: ex?.description ?? c.description ?? null,
        category: ex?.category ?? c.category ?? null,
      };
    });
  }
  return BACKUP_MODULES_MAP[key].findMany();
}

export async function generateBackupPayload(moduleParam: string = "ALL"): Promise<Record<string, any>> {
  const exportData: Record<string, any> = {};

  if (moduleParam === "ALL") {
    for (const key of BACKUP_MODULE_ORDER) {
      try {
        exportData[key] = await fetchModuleData(key);
      } catch (e) {
        console.error(`Failed to export module ${key}`, e);
      }
    }
  } else {
    const dbModule = BACKUP_MODULES_MAP[moduleParam];
    if (!dbModule) {
      throw new Error("Invalid module specified");
    }
    exportData[moduleParam] = await fetchModuleData(moduleParam);

    const companions = BACKUP_MODULE_COMPANIONS[moduleParam] || [];
    for (const comp of companions) {
      try {
        exportData[comp] = await fetchModuleData(comp);
      } catch (e) {
        console.error(`Failed to export companion module ${comp}`, e);
      }
    }
  }

  return exportData;
}

function sanitizeRecord(moduleName: string, raw: any): any {
  const clean: Record<string, any> = { ...raw };
  const stripKeys = RELATION_KEYS_BY_MODULE[moduleName] || [];
  for (const k of stripKeys) {
    delete clean[k];
  }
  return clean;
}

export async function upsertModuleRecord(moduleName: string, item: any): Promise<boolean> {
  const dbModule = BACKUP_MODULES_MAP[moduleName];
  if (!dbModule || !item || typeof item !== "object") return false;

  const isPrivilegedVal = moduleName === "Client" ? item.isPrivileged : undefined;
  const descriptionVal = moduleName === "Client" ? item.description : undefined;
  const categoryVal = moduleName === "Client" ? item.category : undefined;

  const data = sanitizeRecord(moduleName, item);

  if (moduleName === "SystemSetting" && data.key) {
    // Don't overwrite the live OneDrive backup metadata when restoring a past restore point
    if (data.key === BACKUP_META_SETTING_KEY) return false;
    await prisma.systemSetting.upsert({
      where: { key: data.key },
      update: { value: data.value },
      create: data as any,
    });
    return true;
  }

  if (moduleName === "FiscalYear" && data.year !== undefined) {
    await prisma.fiscalYear.upsert({
      where: { year: Number(data.year) },
      update: data as any,
      create: data as any,
    });
    return true;
  }

  let recordId = data.id;

  if (recordId) {
    await dbModule.upsert({
      where: { id: recordId },
      update: data,
      create: data,
    });
  } else {
    const created = await dbModule.create({ data });
    recordId = created?.id;
  }

  if (moduleName === "Client" && recordId) {
    if (isPrivilegedVal !== undefined) {
      await prisma
        .$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isPrivileged" BOOLEAN NOT NULL DEFAULT false;`)
        .catch(() => {});
      await prisma.$executeRaw`UPDATE "Client" SET "isPrivileged" = ${!!isPrivilegedVal} WHERE id = ${recordId}`.catch(() => {});
    }
    if (descriptionVal !== undefined) {
      await prisma.$executeRaw`UPDATE "Client" SET description = ${descriptionVal} WHERE id = ${recordId}`.catch(() => {});
    }
    if (categoryVal !== undefined) {
      await prisma.$executeRaw`UPDATE "Client" SET category = ${categoryVal} WHERE id = ${recordId}`.catch(() => {});
    }
  }

  return true;
}

export async function restoreBackupPayload(importData: any, moduleParam: string = "ALL"): Promise<number> {
  let importedCount = 0;

  if (moduleParam === "ALL") {
    const orderedKeys = [
      ...BACKUP_MODULE_ORDER.filter((k) => k in importData),
      ...Object.keys(importData).filter((k) => !BACKUP_MODULE_ORDER.includes(k as any) && BACKUP_MODULES_MAP[k]),
    ];

    for (const key of orderedKeys) {
      if (BACKUP_MODULES_MAP[key] && Array.isArray(importData[key])) {
        for (const item of importData[key]) {
          try {
            const ok = await upsertModuleRecord(key, item);
            if (ok) importedCount++;
          } catch (e) {
            console.error(`Failed to import item into ${key}`, e);
          }
        }
      }
    }
  } else {
    const dbModule = BACKUP_MODULES_MAP[moduleParam];
    if (!dbModule) {
      throw new Error("Invalid module specified");
    }

    const dataArray = Array.isArray(importData) ? importData : importData[moduleParam];
    if (!Array.isArray(dataArray)) {
      throw new Error(`No array found for module "${moduleParam}" in JSON file`);
    }

    for (const item of dataArray) {
      try {
        const ok = await upsertModuleRecord(moduleParam, item);
        if (ok) importedCount++;
      } catch (e) {
        console.error(`Failed to import item into ${moduleParam}`, e);
      }
    }

    const companions = BACKUP_MODULE_COMPANIONS[moduleParam] || [];
    for (const comp of companions) {
      if (!Array.isArray(importData) && Array.isArray(importData[comp])) {
        for (const item of importData[comp]) {
          try {
            const ok = await upsertModuleRecord(comp, item);
            if (ok) importedCount++;
          } catch (e) {
            console.error(`Failed to import companion item into ${comp}`, e);
          }
        }
      }
    }
  }

  return importedCount;
}

/**
 * Creates a full system restore point JSON file and uploads it to OneDrive under
 * `Malik Law Associates/Portal Backups`. Also rotates old backups beyond MAX_CLOUD_BACKUPS_TO_KEEP.
 */
export async function createOneDriveRestorePoint(trigger: "AUTO" | "MANUAL" | "CRON" = "MANUAL") {
  const payload = await generateBackupPayload("ALL");
  const jsonString = JSON.stringify(payload);

  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .replace(/\..+/, ""); // YYYY-MM-DD_HH-mm-ss
  const fileName = `restore_point_${stamp}_${trigger.toLowerCase()}.json`;

  // Upload to OneDrive (Graph PUT /me/drive/root:/Malik Law Associates/Portal Backups/fileName:/content auto-creates folders)
  const uploaded = await onedrive.uploadFile(BACKUP_ONEDRIVE_FOLDER, fileName, jsonString);

  // Save metadata in SystemSetting
  const meta = {
    lastBackupAt: now.toISOString(),
    lastFileName: uploaded?.name || fileName,
    lastFileId: uploaded?.id || null,
    lastSize: uploaded?.size || Buffer.byteLength(jsonString, "utf8"),
    lastTrigger: trigger,
    folder: BACKUP_ONEDRIVE_FOLDER,
  };

  await prisma.systemSetting.upsert({
    where: { key: BACKUP_META_SETTING_KEY },
    update: { value: meta },
    create: { key: BACKUP_META_SETTING_KEY, value: meta },
  });

  // Retention cleanup: keep newest MAX_CLOUD_BACKUPS_TO_KEEP files
  try {
    const items = await onedrive.listFolder(BACKUP_ONEDRIVE_FOLDER);
    const backupFiles = items
      .filter((i: any) => i.file && i.name?.startsWith("restore_point_") && i.name?.endsWith(".json"))
      .sort((a: any, b: any) => new Date(b.lastModifiedDateTime).getTime() - new Date(a.lastModifiedDateTime).getTime());

    if (backupFiles.length > MAX_CLOUD_BACKUPS_TO_KEEP) {
      const toDelete = backupFiles.slice(MAX_CLOUD_BACKUPS_TO_KEEP);
      for (const oldFile of toDelete) {
        await onedrive.deleteItem(oldFile.id).catch(() => {});
      }
    }
  } catch (cleanupErr) {
    console.warn("OneDrive backup retention cleanup warning:", cleanupErr);
  }

  return meta;
}
