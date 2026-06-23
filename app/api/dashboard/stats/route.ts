import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [clientCount, pendingFilings, recentLogs, recentFiles] = await Promise.all([
      prisma.client.count(),
      prisma.filing.count({ where: { status: "PENDING" } }),
      prisma.activityLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.activityLog.findMany({
        where: { action: "UPLOAD" },
        orderBy: { timestamp: "desc" },
        take: 5,
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
    ]);

    // For "Files Uploaded", we can count total upload actions
    const totalUploads = await prisma.activityLog.count({
        where: { action: "UPLOAD" }
    });

    return NextResponse.json({
      stats: [
        { label: 'Active Clients', value: clientCount.toString(), change: '+2%' },
        { label: 'Files Uploaded', value: totalUploads.toString(), change: '+12%' },
        { label: 'Recent Activity (24h)', value: recentLogs.toString(), change: '+5%' },
        { label: 'Pending Filings', value: pendingFilings.toString(), change: '-3%' },
      ],
      recentFiles: recentFiles.map(log => ({
        name: log.resource ? log.resource.split('/').pop() : 'Unknown',
        user: log.user.name || log.user.email,
        details: log.details,
        date: formatRelativeTime(log.timestamp)
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

