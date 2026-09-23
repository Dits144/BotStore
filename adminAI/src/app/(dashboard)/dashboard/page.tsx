"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Bot,
  UserCheck,
  Clock,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { formatIDR } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalConversations: 18,
    aiHandled: 14,
    humanHandled: 4,
    pendingConversations: 2,
    ordersToday: 5,
    revenueToday: 155000,
    handoverRate: "22%",
    avgResponseTime: "1.4s",
  });

  const recentActivity = [
    { id: 1, type: "AI_REPLY", title: "ChatGPT Plus Inquiry", user: "Budi Santoso", time: "10 menit lalu", status: "AUTO" },
    { id: 2, type: "HANDOVER", title: "Komplain Akun Canva", user: "Siti Rahma", time: "25 menit lalu", status: "MANUAL" },
    { id: 3, type: "SUGGESTION", title: "Tanya Stok Netflix", user: "Ahmad Fauzi", time: "45 menit lalu", status: "ASSIST" },
    { id: 4, type: "ORDER", title: "Order Claude Pro Paid", user: "Dewi Lestari", time: "1 jam lalu", status: "COMPLETED" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Dashboard Overview</span>
          <h2 className="text-2xl font-bold text-white mt-1">DitsStore CS Operations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring performa AI Assistant, penanganan kendala pelanggan, dan pendapatan toko hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI Router Mode: <strong className="text-emerald-400">AUTO ACTIVE</strong>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Conversations Today</span>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats.totalConversations}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+15% dari kemarin</span>
          </div>
        </div>

        {/* AI Handled */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Handled</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-3">{stats.aiHandled}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400">
            <span>77.7% dari total percakapan</span>
          </div>
        </div>

        {/* Human Handled & Handover Rate */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Human Handled</span>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-3">{stats.humanHandled}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-400/90 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Handover Rate: {stats.handoverRate}</span>
          </div>
        </div>

        {/* Revenue Today */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Revenue Today</span>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-300 mt-3">{formatIDR(stats.revenueToday)}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400">
            <span>{stats.ordersToday} Pesanan Sukses</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Pending Attention</p>
              <p className="text-sm font-semibold text-slate-200">{stats.pendingConversations} Customer Membutuhkan Admin</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Average Response Time</p>
              <p className="text-sm font-semibold text-slate-200">{stats.avgResponseTime} (AI Autoreply)</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">AI Confidence Avg</p>
              <p className="text-sm font-semibold text-slate-200">95.4% Accurate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200 text-sm">Aktivitas CS & WhatsApp Terkini</h3>
          <a href="/inbox" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
            Buka CS Inbox <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3">
          {recentActivity.map((act) => (
            <div key={act.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:bg-slate-800/70 transition">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  act.status === 'AUTO' ? 'bg-emerald-500/10 text-emerald-400' :
                  act.status === 'ASSIST' ? 'bg-amber-500/10 text-amber-400' :
                  act.status === 'MANUAL' ? 'bg-rose-500/10 text-rose-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {act.status}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{act.title}</h4>
                  <p className="text-[11px] text-slate-400">Pelanggan: {act.user}</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
