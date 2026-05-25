import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "iris_session" },
    });

    if (setting) {
      const ageHours = (Date.now() - setting.updatedAt.getTime()) / (1000 * 60 * 60);
      return NextResponse.json({
        active: true,
        savedAt: setting.updatedAt,
        ageHours: ageHours.toFixed(1),
        expired: ageHours > 12,
      });
    }

    return NextResponse.json({ active: false });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json({ active: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.storage) {
      return NextResponse.json({ error: "Invalid session data" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: "iris_session" },
      update: { value: body },
      create: {
        key: "iris_session",
        value: body,
      },
    });

    return NextResponse.json({ message: "Session saved successfully", savedAt: setting.updatedAt });
  } catch (error: any) {
    console.error("Failed to save session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.systemSetting.deleteMany({
      where: { key: "iris_session" },
    });
    return NextResponse.json({ message: "Session cleared" });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json({ message: "Session cleared" });
  }
}
