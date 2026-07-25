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

    const task = await prisma.task.findUnique({ where: { id: params.id } });

    // Create Notification for the assigned user (or self if unassigned)
    const targetUserId = task?.assignedToId || session.user.id;

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: "Reminder",
        message: `Reminder set for task "${task?.title || 'Unknown'}": ${note || 'No note'}`,
        type: "REMINDER"
      }
    });

    return NextResponse.json(reminder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
