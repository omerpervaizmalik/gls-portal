"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { ShieldCheck, ShieldAlert, ShieldOff, RefreshCw, Trash2, Terminal, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface SessionStatus {
  active: boolean;
  savedAt?: string;
  ageHours?: string;
  expired?: boolean;
}

export default function IrisSettingsPage() {
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/iris/session");
      const data = await res.json();
      setSession(data);
    } catch {
      setSession({ active: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleClearSession = async () => {
    if (!confirm("Clear the saved IRIS session? You will need to capture it again.")) return;
    setClearing(true);
    await fetch("/api/iris/session", { method: "DELETE" });
    await fetchStatus();
    setClearing(false);
  };

  const statusCard = () => {
    if (loading) {
      return (
        <div className="flex items-center text-slate-400">
          <RefreshCw className="animate-spin mr-3 h-5 w-5" />
          Checking session status...
        </div>
      );
    }
    if (!session?.active) {
      return (
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-xl mr-4">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-red-700">No Active Session</p>
            <p className="text-sm text-slate-500">You need to capture an IRIS session before syncing clients.</p>
          </div>
        </div>
      );
    }
    if (session.expired) {
      return (
        <div className="flex items-center">
          <div className="p-3 bg-amber-100 rounded-xl mr-4">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-700">Session Expired</p>
            <p className="text-sm text-slate-500">
              Saved {session.ageHours}h ago — IRIS sessions expire after ~12 hours. Please re-capture.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center">
        <div className="p-3 bg-emerald-100 rounded-xl mr-4">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-700">Session Active ✓</p>
          <p className="text-sm text-slate-500">
            Captured {session.ageHours}h ago — valid for sync operations.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">IRIS Integration</h1>
            <p className="text-xs text-slate-500">FBR IRIS portal session management and sync settings</p>
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-8 space-y-6">

          {/* Session Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Session Status</h2>
            <div className="flex items-center justify-between">
              {statusCard()}
              <div className="flex items-center space-x-2">
                <button onClick={fetchStatus} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400" title="Refresh">
                  <RefreshCw size={16} />
                </button>
                {session?.active && (
                  <button
                    onClick={handleClearSession}
                    disabled={clearing}
                    className="flex items-center px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors"
                  >
                    <Trash2 size={13} className="mr-1" /> Clear Session
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* How to Capture Session */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">How to Capture Your IRIS Session</h2>

            <div className="space-y-4">
              {[
                {
                  step: "1",
                  icon: Terminal,
                  color: "bg-blue-50 text-blue-600",
                  title: "Open a Terminal in your project folder",
                  desc: "Open a command prompt or PowerShell in the management system folder.",
                },
                {
                  step: "2",
                  icon: CheckCircle2,
                  color: "bg-purple-50 text-purple-600",
                  title: "Run the capture script",
                  desc: 'Type the following command and press Enter:',
                  code: "python scripts/iris_capture_session.py",
                },
                {
                  step: "3",
                  icon: ShieldCheck,
                  color: "bg-emerald-50 text-emerald-600",
                  title: "Log in through the browser that opens",
                  desc: "A real browser window will open. Enter your CNIC/NTN and password, solve the CAPTCHA, and log in. When you reach the dashboard, press ENTER in the terminal.",
                },
                {
                  step: "4",
                  icon: Clock,
                  color: "bg-amber-50 text-amber-600",
                  title: "Session is saved automatically",
                  desc: "The session will be saved and used for all future sync operations. It remains valid for ~12 hours. Repeat daily or when it expires.",
                },
              ].map(({ step, icon: Icon, color, title, desc, code }) => (
                <div key={step} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${color} flex items-center justify-center font-bold text-sm`}>
                    {step}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{title}</p>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    {code && (
                      <div className="mt-2 bg-slate-900 rounded-lg px-4 py-2.5 flex items-center justify-between group">
                        <code className="text-emerald-400 text-xs font-mono">{code}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(code)}
                          className="text-slate-500 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Important Security Note</p>
              <p className="text-xs text-amber-700 mt-1">
                The captured session file (<code className="bg-amber-100 px-1 rounded">scripts/iris_session.json</code>) contains
                authentication tokens. Do not share this file or commit it to version control. It is automatically excluded from git
                via <code className="bg-amber-100 px-1 rounded">.gitignore</code>.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
