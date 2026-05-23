import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";

  try {
    // 1. Fetch File Activity Logs
    const activityLogs = await prisma.activityLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { timestamp: "desc" },
      take: 100
    });

    // 2. Fetch Task Logs
    const taskLogs = await prisma.taskLog.findMany({
      include: { 
        user: { select: { name: true } },
        task: { select: { title: true } }
      },
      orderBy: { timestamp: "desc" },
      take: 100
    });

    // 3. Fetch Filing Logs
    const filingLogs = await prisma.filingLog.findMany({
      include: {
        filing: { select: { year: true, client: { select: { name: true } } } }
      },
      orderBy: { timestamp: "desc" },
      take: 100
    });

    // Unify all logs into a single format
    let unifiedLogs: any[] = [];

    activityLogs.forEach(log => {
      unifiedLogs.push({
        id: `act_${log.id}`,
        action: log.action,
        path: log.path,
        details: log.details || "File system activity",
        user: log.user,
        timestamp: log.timestamp,
        source: 'FILE'
      });
    });

    taskLogs.forEach(log => {
      unifiedLogs.push({
        id: `tsk_${log.id}`,
        action: log.action,
        path: `Task: ${log.task?.title || 'Unknown Task'}`,
        details: log.details || "Task update",
        user: log.user,
        timestamp: log.timestamp,
        source: 'TASK'
      });
    });

    filingLogs.forEach(log => {
      unifiedLogs.push({
        id: `fil_${log.id}`,
        action: log.type || 'FILING_UPDATE',
        path: `Tax Filing: ${log.filing?.client?.name || 'Unknown Client'} (${log.filing?.year})`,
        details: `${log.stage ? `[${log.stage}] ` : ''}${log.note}`,
        user: { name: log.userName || "System" },
        timestamp: log.timestamp,
        source: 'FILING'
      });
    });

    // Filter by search
    if (search) {
      unifiedLogs = unifiedLogs.filter(log => 
        log.action.toLowerCase().includes(search) ||
        log.path.toLowerCase().includes(search) ||
        (log.details && log.details.toLowerCase().includes(search)) ||
        (log.user?.name && log.user.name.toLowerCase().includes(search))
      );
    }

    // Sort combined logs by timestamp descending
    unifiedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return the top 100 combined
    return NextResponse.json(unifiedLogs.slice(0, 100));

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

