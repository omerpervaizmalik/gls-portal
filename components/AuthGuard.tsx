"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Routes that do NOT require authentication
const PUBLIC_PATHS = ["/login", "/terms", "/privacy", "/help"];

/**
 * AuthGuard — client-side auth protection.
 * Replaces Edge Runtime middleware (which fails on Vercel Linux due to __dirname).
 * Must be placed inside <SessionProvider> (i.e. inside <Providers>).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return; // wait until session is resolved

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!session && !isPublic) {
      router.replace("/login?callbackUrl=" + encodeURIComponent(pathname));
    }
  }, [session, status, pathname, router]);

  // While checking auth, show a dark loading screen (matches app theme)
  if (status === "loading") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#0a0f1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  return <>{children}</>;
}
