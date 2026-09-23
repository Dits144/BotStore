"use client";

import { BarChart3, TrendingUp, Bot, UserCheck, CheckCircle2, ShieldAlert } from "lucide-react";
import { formatIDR } from "@/lib/utils";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" /> Performa & Analisis AI Customer Service
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Statistik performa AI vs Penanganan Manusia, rasio kecerdasan AI, dan produk paling sering ditanyakan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Total Customer Inquiries</span>
          <p className="text-2xl font-bold text-white">142 Chat</p>
          <span className="text-[11px] text-emerald-400 font-medium">Bulan ini</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">AI Automation Rate</span>
          <p className="text-2xl font-bold text-emerald-400">78.2%</p>
          <span className="text-[11px] text-slate-400">Ditangani AI sepenuhnya tanpa perlu campur tangan admin</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Handover Rate</span>
          <p className="text-2xl font-bold text-amber-400">21.8%</p>
          <span className="text-[11px] text-slate-400">Komplain, garansi, atau refund yang dialihkan ke admin</span>
        </div>
      </div>

      {/* Top Products Asked Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Top 5 Produk Paling Sering Ditanyakan Customer</h3>
        <div className="space-y-3 text-xs">
          {[
            { name: "ChatGPT Plus (1 Bulan)", count: "58 Pertanyaan", revenue: "Rp 1.740.000" },
            { name: "Claude Pro (1 Bulan)", count: "34 Pertanyaan", revenue: "Rp 1.190.000" },
            { name: "Canva Pro Individual (1 Tahun)", count: "26 Pertanyaan", revenue: "Rp 390.000" },
            { name: "Netflix Premium Ultra HD", count: "14 Pertanyaan", revenue: "Rp 630.000" },
          ].map((item, idx) => (
            <div key={item.name} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="font-semibold text-slate-200">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-400">{item.revenue}</div>
                <div className="text-[10px] text-slate-400">{item.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
