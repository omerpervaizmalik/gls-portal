"use client";

import { useSession, signIn } from "next-auth/react";
import { AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const isImpersonating = (session?.user as any)?.isImpersonating;

  if (!isImpersonating) return null;

  const handleStopImpersonating = async () => {
    setLoading(true);
    try {
      await signIn('stop_impersonating', { redirect: false });
      window.location.href = '/admin/users';
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-[9999] relative">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-red-200 flex-shrink-0" />
        <span className="text-xs md:text-sm font-bold truncate">
          You are currently impersonating {session?.user?.name || session?.user?.email}.
        </span>
      </div>
      <button 
        onClick={handleStopImpersonating}
        disabled={loading}
        className="flex items-center px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
        Finish Impersonating
      </button>
    </div>
  );
}
