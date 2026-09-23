"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Bot, QrCode } from "lucide-react";
import Link from "next/link";

export function Header() {
  const [waConnected, setWaConnected] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const checkWa = async () => {
      try {
        const res = await fetch("/api/whatsapp/status");
        const json = await res.json();
        if (json.success && json.data) {
          setWaConnected(json.data.connected);
        }
      } catch (e) {
        // ignore
      }
    };
    checkWa();
    const interval = setInterval(checkWa, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari percakapan, pelanggan, atau produk..."
            className="w-full bg-slate-800/80 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-700/60 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center gap-4">
        {/* AI Engine Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs">
          <Bot className={`w-3.5 h-3.5 ${aiEnabled ? "text-indigo-400" : "text-slate-500"}`} />
          <span className="text-slate-300 font-medium">AI Engine:</span>
          <span className={`font-semibold ${aiEnabled ? "text-emerald-400" : "text-amber-400"}`}>
            {aiEnabled ? "Gemini Active" : "Disabled"}
          </span>
        </div>

        {/* WhatsApp Connection Status */}
        <Link href="/whatsapp">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs hover:border-indigo-500/50 transition cursor-pointer">
            <QrCode className={`w-3.5 h-3.5 ${waConnected ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="text-slate-300 font-medium">WhatsApp:</span>
            <span className={`font-semibold ${waConnected ? "text-emerald-400" : "text-amber-400"}`}>
              {waConnected ? "Connected" : "Disconnected (Scan QR)"}
            </span>
          </div>
        </Link>

        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
        </button>
      </div>
    </header>
  );
}
