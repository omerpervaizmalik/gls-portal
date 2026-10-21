"use client";

import React, { useState, useEffect } from 'react';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { isNative } from '@/lib/platform';
import { ShieldCheck, Lock, Fingerprint, Loader2 } from 'lucide-react';

interface BiometricGateProps {
  children: React.ReactNode;
}

export default function BiometricGate({ children }: BiometricGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBiometrics = async () => {
    // 1. If running inside an iframe, NEVER block or prompt for biometrics
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    // 2. If not running on native mobile device, skip
    if (!isNative()) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    // 3. If already authenticated in this session, skip
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('biometric_auth_passed') === 'true') {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }
    } catch {
      // Ignore storage errors in private browsing
    }

    // 4. Wrap with a timeout safety guard (3.5s) to prevent infinite hanging
    const timeoutPromise = new Promise<{ isAvailable: boolean }>((_, reject) =>
      setTimeout(() => reject(new Error('Biometric check timed out')), 3500)
    );

    try {
      const result = await Promise.race([
        NativeBiometric.isAvailable(),
        timeoutPromise
      ]);

      if (result && result.isAvailable) {
        setHasBiometrics(true);
        performAuth();
      } else {
        // Biometrics not available on this device, skip
        setIsAuthenticated(true);
        setIsChecking(false);
      }
    } catch (err: any) {
      console.warn('Biometric check bypassed or failed:', err?.message || err);
      // Fail-open on timeout or hardware check error so app is never stuck
      setIsAuthenticated(true);
      setIsChecking(false);
    }
  };

  const performAuth = async () => {
    setError(null);
    try {
      const authTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Authentication prompt timed out')), 25000)
      );

      await Promise.race([
        NativeBiometric.verifyIdentity({
          reason: "Accessing Get Legal Solution Management Portal",
          title: "Security Verification",
          subtitle: "Authenticate to continue",
          description: "Please use your fingerprint or face recognition to unlock the app.",
        }),
        authTimeout
      ]);

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('biometric_auth_passed', 'true');
        }
      } catch {}

      setIsAuthenticated(true);
      setIsChecking(false);
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBiometrics();
  }, []);

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-[100] p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Security Check</h2>
        <p className="text-slate-400 text-sm">Verifying biometric hardware...</p>
      </div>
    );
  }

  if (!isAuthenticated && hasBiometrics) {
    return (
      <div className="fixed inset-0 bg-[#0a0c10] flex flex-col items-center justify-center z-[100] p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/20">
          <Lock className="h-12 w-12 text-white" />
        </div>
        
        <div className="max-w-xs">
          <h1 className="text-2xl font-bold text-white mb-3">App Locked</h1>
          <p className="text-slate-400 text-sm mb-10">
            {error ? `Error: ${error}` : "This app is protected by your device security. Please authenticate to access your files and tasks."}
          </p>
        </div>

        <button 
          onClick={performAuth}
          className="group flex flex-col items-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-amber-500 hover:border-amber-400 transition-all duration-300">
            <Fingerprint className="h-8 w-8 text-amber-500 group-hover:text-white" />
          </div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest group-hover:text-amber-400">Tap to Unlock</span>
        </button>

        <div className="mt-auto pt-10">
          <div className="flex items-center space-x-2 text-slate-600">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Security Verified</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
