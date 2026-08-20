"use client";

import { useState } from "react";
import { Wrench, Database, Trash2, Loader2, Sparkles, X } from "lucide-react";
import { seedDemoDataAction, clearDemoDataAction } from "@/lib/actions";

export function DevTools() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [open, setOpen] = useState(false);

  // Expose this component only in development environment
  if (process.env.NODE_ENV !== "development") return null;

  const handleAction = async (action: () => Promise<{ ok: boolean; message: string } | null>) => {
    setLoading(true);
    setMsg("");
    setErrorMsg("");
    try {
      const res = await action();
      if (res && res.ok) {
        setMsg(res.message);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(res?.message || "Action failed.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end">
      {open ? (
        <div className="mb-3 w-80 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-brand-600 animate-pulse" />
              <span className="font-bold text-slate-800 text-sm">Developer Console</span>
            </div>
            <button 
              onClick={() => setOpen(false)} 
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Close Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-4 text-xs text-slate-500 leading-relaxed">
            Manage realistic seed datasets for development testing. Actions are RLS-compliant and affect only your current authenticated user.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleAction(seedDemoDataAction)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Database className="h-3.5 w-3.5" />
              )}
              {loading ? "Processing..." : "Seed Demo Dataset"}
            </button>

            <button
              onClick={() => handleAction(clearDemoDataAction)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {loading ? "Processing..." : "Clear My Data"}
            </button>
          </div>

          {msg && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800 border border-emerald-100">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{msg} Reloading page...</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800 border border-red-100">
              {errorMsg}
            </div>
          )}
        </div>
      ) : null}

      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition transform hover:scale-105 active:scale-95"
        title="Developer Tools"
      >
        <Wrench className="h-5 w-5" />
      </button>
    </div>
  );
}
