import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string || "profiles";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

    // Upload via storage abstraction (OneDrive or Local)
    const result = await storage.uploadFile(path, fileName, buffer);

    // Provide the file URL via storage-gateway
    const uploadedPath = result?.path || result?.id || `${path}/${fileName}`;
    const publicUrl = `/api/storage-gateway/download?path=${encodeURIComponent(uploadedPath)}`;

    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
