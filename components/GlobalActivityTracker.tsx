"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function GlobalActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    // Build the full URL path
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    // Fire and forget logging
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'NAVIGATE',
        module: 'NAVIGATION',
        resource: url,
        details: `Navigated to ${url}`
      })
    }).catch((e) => {
      // Silently fail if log can't be sent
      console.error('Failed to log navigation', e);
    });

  }, [pathname, searchParams, status, session]);

  return null;
}
