"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AuthGuard } from "@/components/AuthGuard";
import BiometricGate from "@/components/BiometricGate";
import MobileTopBar from "@/components/MobileTopBar";
import BottomNav from "@/components/BottomNav";
import GlobalNotificationManager from "@/components/GlobalNotificationManager";
import GlobalActivityTracker from "@/components/GlobalActivityTracker";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { initMobileAppStyling, isNative } from "@/lib/platform";
import React from "react";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = 'https://portal.getlegalsolution.com';

function NativeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isLogin = pathname === '/login';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0a0f1e', overflow: 'hidden' }}>
      <ImpersonationBanner />
      {/* Show back-bar on every page except the icon grid home */}
      {!isHome && !isLogin && <MobileTopBar />}
      <div 
        style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0 }}
        className={!isLogin ? "pb-20" : ""}
      >
        {children}
      </div>
      {!isLogin && <BottomNav />}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = React.useState(false);
  const [native, setNative] = React.useState(false);

  React.useEffect(() => {
    initMobileAppStyling();
    const nativeMode = isNative();
    setNative(nativeMode);
    setMounted(true);

    if (nativeMode) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack || window.location.pathname === '/') {
            const exit = window.confirm("Are you sure you want to exit the app?");
            if (exit) {
              App.exitApp();
            }
          } else {
            window.history.back();
          }
        });
      });
    }
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthGuard>
            <GlobalNotificationManager />
            <GlobalActivityTracker />
          {!mounted ? (
            <div style={{ width: '100vw', height: '100vh', background: '#0a0f1e' }} />
          ) : (
            <BiometricGate>
              {native ? (
                <NativeLayout>{children}</NativeLayout>
              ) : (
                <div className="flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:block">
                  <ImpersonationBanner />
                  <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
                    {children}
                  </div>
                </div>
              )}
            </BiometricGate>
          )}
        </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
