import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const reminders = await prisma.reminder.findMany({
      where: { 
        taskId: params.id,
        userId: session.user.id
      },
      orderBy: { remindAt: 'asc' }
    });
    return NextResponse.json(reminders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { remindAt, note } = await req.json();
    const reminder = await prisma.reminder.create({
      data: {
        taskId: params.id,
        userId: session.user.id,
        remindAt: new Date(remindAt),
        note
      }
    });

    // Create Notification for the reminder
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Reminder Set",
        message: `Reminder set for: ${new Date(remindAt).toLocaleString()}. Note: ${note || 'No note'}`,
        type: "REMINDER"
      }
    });

    return NextResponse.json(reminder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
