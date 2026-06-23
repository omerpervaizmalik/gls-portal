import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

type LogOptions = {
  userId: string;
  action: string;
  module?: string;
  resource?: string;
  details?: string;
  metadata?: any;
};

export async function logActivity(options: LogOptions) {
  try {
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    const userAgent = headersList.get('user-agent') || undefined;

    await prisma.activityLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        module: options.module || 'GENERAL',
        resource: options.resource,
        details: options.details,
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : undefined,
        ipAddress,
        userAgent,
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
