import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
        createdBy: true,
        matter: { include: { client: true } },
        logs: {
          include: { user: true },
          orderBy: { timestamp: 'desc' }
        },
        attachments: true
      }
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { status, priority, assignedToId, billableHours, description, title, note, attachments } = body;

    const oldTask = await prisma.task.findUnique({ where: { id: params.id } });
    if (!oldTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: status || undefined,
        priority: priority || undefined,
        assignedToId: assignedToId === "" ? null : (assignedToId || undefined),
        billableHours: billableHours ? parseFloat(billableHours) : undefined,
        description: description || undefined,
        title: title || undefined,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      }
    });

    // Handle Attachments (File Saving)
    if (attachments && attachments.length > 0) {
      for (const a of attachments) {
        if (a.content) {
          const folderPath = `TaskAttachments/${params.id}`;
          
          let fileBuffer: Buffer | string = a.content;
          if (typeof a.content === 'string' && a.content.includes(';base64,')) {
            const base64Data = a.content.split(';base64,').pop() || '';
            fileBuffer = Buffer.from(base64Data, 'base64');
          }

          await storage.uploadFile(folderPath, a.fileName, fileBuffer);
          
          await prisma.taskAttachment.create({
            data: {
              taskId: params.id,
              fileName: a.fileName,
              fileUrl: `/${folderPath}/${a.fileName}`
            }
          });
        }
      }
    }

    // Audit Logging with Note
    let logMsg = note || `Status updated to ${status || task.status}`;
    if (status && status !== oldTask.status && !note) {
      logMsg = `Status changed from ${oldTask.status} to ${status}`;
    }
    
    await prisma.taskLog.create({
      data: {
        taskId: task.id,
        userId: (token as any).id as string,
        action: status ? `STATUS_UPDATE: ${status}` : "PROGRESS_UPDATE",
        details: logMsg
      }
    });

    // Fetch the fully updated task with all inclusions
    const fullTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
        createdBy: true,
        matter: { include: { client: true } },
        logs: {
          include: { user: true },
          orderBy: { timestamp: 'desc' }
        },
        attachments: true
      }
    });

    return NextResponse.json(fullTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });
  }

  try {
    // Delete task and its relations (Prisma handles Cascade if set in schema)
    await prisma.task.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TASK_DELETE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
