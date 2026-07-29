import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Package,
  RotateCcw,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";

import { useAuth } from "../lib/auth-context";
import {
  fetchTransactions,
  fetchTransactionStats,
  fetchTransactionChart,
  fetchTopProducts,
  updateTransactionStatus,
  type Transaction,
} from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export const Route = createFileRoute("/dashboard/transactions")({
  component: TransactionsPage,
});

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

const STATUS_CONFIG = {
  pending: { label: "Pending",  color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/20", icon: Clock },
  done:    { label: "Done",     color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  refund:  { label: "Refund",   color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20",   icon: RotateCcw },
  batal:   { label: "Batal",    color: "text-red-400",     bg: "bg-red-400/10 border-red-400/20",     icon: XCircle },
} as const;

function formatRupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function phoneFromJid(jid: string) {
  return jid.split("@")[0] || jid;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: { month: string; revenue_done: number; revenue_refund: number; profit: number }[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.revenue_done, d.profit, 1)), 1);
  const W = 600, H = 160;
  const BAR_W = 14;
  const GROUP_W = BAR_W * 2 + 4;
  const GAP = (W - data.length * GROUP_W) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" aria-label="Grafik pendapatan per bulan">
      {data.map((d, i) => {
        const groupX = GAP + i * (GROUP_W + GAP);
        const x1 = groupX;
        const x2 = groupX + BAR_W + 2;

        const h1 = max > 0 ? Math.round((d.revenue_done / max) * H) : 0;
        const y1 = H - h1;

        const profitVal = Math.max(0, d.profit);
        const h2 = max > 0 ? Math.round((profitVal / max) * H) : 0;
        const y2 = H - h2;

        return (
          <g key={d.month}>
            {/* Bar 1: Pemasukan (Done) */}
            <rect
              x={x1} y={y1} width={BAR_W} height={h1}
              rx={2}
              className="fill-emerald-500/80 hover:fill-emerald-500 transition-colors"
            />
            {h1 > 0 && (
              <title>Pemasukan (Done): {formatRupiah(d.revenue_done)}</title>
            )}

            {/* Bar 2: Profit Bersih */}
            <rect
              x={x2} y={y2} width={BAR_W} height={h2}
              rx={2}
              className="fill-primary/80 hover:fill-primary transition-colors"
            />
            {h2 > 0 && (
              <title>Profit Bersih: {formatRupiah(d.profit)} (Refund: {formatRupiah(d.revenue_refund)})</title>
            )}

            {/* Month label */}
            <text
              x={groupX + GROUP_W / 2} y={H + 18}
              textAnchor="middle" fontSize={10}
              className="fill-muted-foreground"
            >
              {MONTH_LABELS[parseInt(d.month) - 1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function TransactionsPage() {
  const { activeGroup } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const token = activeGroup?.token ?? "";

  const { data: stats } = useQuery({
    queryKey: ["trx-stats", token],
    queryFn: () => fetchTransactionStats(token),
    enabled: !!token,
  });

  const { data: chart = [] } = useQuery({
    queryKey: ["trx-chart", token],
    queryFn: () => fetchTransactionChart(token),
    enabled: !!token,
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["trx-top", token],
    queryFn: () => fetchTopProducts(token, 5),
    enabled: !!token,
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["trx-list", token, statusFilter],
    queryFn: () => fetchTransactions(token, { status: statusFilter === "all" ? undefined : statusFilter, limit: 100 }),
    enabled: !!token,
  });

  const updateStatus = useMutation({
    mutationFn: ({ trxId, status }: { trxId: string; status: "pending" | "done" | "refund" | "batal" }) =>
      updateTransactionStatus(trxId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trx-list", token] });
      qc.invalidateQueries({ queryKey: ["trx-stats", token] });
      toast.success("Status transaksi diperbarui");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal memperbarui status"),
  });

  if (!token) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Pilih grup aktif terlebih dahulu.
      </div>
    );
  }

  const statCards = [
    {
      label: "Pemasukan Hari Ini",
      value: formatRupiah(stats?.today.revenue_done ?? 0),
      sub: `Profit: ${formatRupiah(stats?.today.profit ?? 0)} · Refund: ${formatRupiah(stats?.today.revenue_refund ?? 0)}`,
      icon: WalletCards,
      color: "text-emerald-400",
    },
    {
      label: "Pemasukan Bulan Ini",
      value: formatRupiah(stats?.month.revenue_done ?? 0),
      sub: `Profit: ${formatRupiah(stats?.month.profit ?? 0)} · Refund: ${formatRupiah(stats?.month.revenue_refund ?? 0)}`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Total Pemasukan",
      value: formatRupiah(stats?.allTime.revenue_done ?? 0),
      sub: `Profit: ${formatRupiah(stats?.allTime.profit ?? 0)} · Refund: ${formatRupiah(stats?.allTime.revenue_refund ?? 0)}`,
      icon: BarChart3,
      color: "text-blue-400",
    },
    {
      label: "Rata-rata Profit / TRX",
      value: stats?.allTime.total_count
        ? formatRupiah(Math.round((stats.allTime.profit ?? 0) / stats.allTime.total_count))
        : "Rp0",
      sub: "Dari semua transaksi",
      icon: ArrowUpRight,
      color: "text-violet-400",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-semibold tracking-tight">Transaksi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Riwayat transaksi dan rekap pendapatan — {activeGroup?.name}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{card.value}</div>
              <div className="text-[11px] text-muted-foreground">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Chart + Top Products */}
      <div className="grid gap-4 lg:grid-cols-3 animate-fade-in-up">
        {/* Revenue Chart */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Kinerja Keuangan {new Date().getFullYear()}
            </h2>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
                <span className="text-muted-foreground">Profit Bersih</span>
              </div>
            </div>
          </div>
          {chart.length > 0 ? (
            <RevenueChart data={chart} />
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              Belum ada data transaksi
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Produk Terlaku
          </h2>
          {topProducts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              Belum ada data
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.product} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium capitalize">{p.product || "(kosong)"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.count}x · {formatRupiah(p.revenue)}
                    </div>
                  </div>
                  <Package className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Riwayat Transaksi
          </h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-popover/95 backdrop-blur-xl">
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="batal">Batal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Memuat transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Belum ada transaksi</p>
            <p className="text-xs mt-1">Gunakan perintah p/d/r/b di grup WhatsApp</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pl-2 font-medium">TRX ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Produk</th>
                  <th className="pb-3 font-medium">Nominal</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Waktu</th>
                  <th className="pb-3 pr-2 font-medium">Ubah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {transactions.map((trx: Transaction) => (
                  <tr
                    key={trx.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 pl-2 font-mono text-[11px] text-muted-foreground">
                      {trx.trx_id}
                    </td>
                    <td className="py-3 font-mono text-xs">
                      {trx.customer_name && trx.customer_name.trim()
                        ? (trx.customer_name.trim().startsWith("@") ? trx.customer_name.trim() : `@${trx.customer_name.trim()}`)
                        : `@${phoneFromJid(trx.customer_jid)}`}
                    </td>
                    <td className="py-3 max-w-[120px]">
                      <span className="truncate block text-xs capitalize">{trx.product || "—"}</span>
                    </td>
                    <td className="py-3 font-semibold text-xs">
                      {trx.amount > 0 ? (
                        <span className="text-emerald-400">{formatRupiah(trx.amount)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={trx.status} />
                    </td>
                    <td className="py-3 text-[11px] text-muted-foreground whitespace-nowrap">
                      {timeAgo(trx.created_at)}
                    </td>
                    <td className="py-3 pr-2">
                      <Select
                        value={trx.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({
                            trxId: trx.trx_id,
                            status: v as "pending" | "done" | "refund" | "batal",
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-24 text-[10px] bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-popover/95 backdrop-blur-xl text-xs">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
                          <SelectItem value="batal">Batal</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
