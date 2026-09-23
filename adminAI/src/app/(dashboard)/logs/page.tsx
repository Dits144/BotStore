"use client";

import { useState } from "react";
import { FileText, Search, ShieldAlert, Bot, UserCheck, CheckCircle2 } from "lucide-react";
import { mockStore } from "@/lib/mockStore";
import { formatDate } from "@/lib/utils";

export default function LogsPage() {
  const [logs, setLogs] = useState(mockStore.getLogs());
  const [search, setSearch] = useState("");

  const filtered = logs.filter(
    (l) =>
      l.event.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      (l.customerName && l.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" /> Audit & System Activity Logs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Catatan riwayat seluruh aktivitas AI Router, panggilan tools database, perubahan mode, dan handover admin.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari event, actor, atau nama pelanggan..."
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 text-slate-400">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="p-4 font-bold text-indigo-300">
                    {log.event}
                  </td>
                  <td className="p-4 text-slate-300">
                    {log.actor}
                  </td>
                  <td className="p-4 text-slate-200 font-sans">
                    {log.customerName || "-"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : log.status === "WARNING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
