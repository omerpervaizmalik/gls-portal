import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  try {
    const where: any = {};
    
    // RBAC: Junior associates only see their tasks. Seniors see all.
    if (session.user.role !== "ADMIN") {
      where.assignedToId = session.user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
        matter: {
          include: { client: { select: { name: true } } }
        }
      },
      orderBy: { deadline: 'asc' }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, priority, deadline, matterId, assignedToId } = body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        matterId: matterId || null,
        assignedToId: assignedToId || null,
        createdById: session.user.id,
      }
    });

    // Create Audit Log
    await prisma.taskLog.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        action: "TASK_CREATED",
        details: `Task created: ${title}`
      }
    });

    // Create Notification for assigned user
    if (assignedToId) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: "New Task Assigned",
          message: `You have been assigned a new task: ${title}`,
          type: "TASK"
        }
      });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

