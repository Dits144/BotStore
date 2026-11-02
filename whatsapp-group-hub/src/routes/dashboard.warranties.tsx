import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock3, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { fetchWarranties, type WarrantyRecord } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/dashboard/warranties")({
  component: WarrantiesPage,
});

type Filter = "all" | "processing" | "active" | "expired" | "unknown" | "inactive";

function validTime(value: string | null): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function formatDate(value: string | null): string {
  const time = validTime(value);
  return time === null ? "—" : new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short",
  }).format(time);
}

function countdown(expiresAt: string | null, now: number): string {
  const expiry = validTime(expiresAt);
  if (expiry === null) return "Durasi belum diketahui";
  const remaining = expiry - now;
  if (remaining <= 0) return "Masa aktif berakhir";
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return days > 0
    ? `${days} hari ${hours} jam ${minutes} menit`
    : `${hours} jam ${minutes} menit ${seconds} detik`;
}

function category(item: WarrantyRecord, now: number): Filter {
  // A countdown starts when the order is processed, but warranty eligibility
  // requires an explicit completed transaction. Never infer it from the clock.
  if (item.status !== "done") {
    return item.status === "pending" || item.status === "processing" ? "processing" : "inactive";
  }
  const expiry = validTime(item.expires_at);
  if (expiry === null) return "unknown";
  return expiry <= now ? "expired" : "active";
}

const labels: Record<Filter, string> = {
  all: "Semua",
  processing: "Belum selesai",
  active: "Garansi berlaku",
  expired: "Masa aktif habis",
  unknown: "Durasi belum diketahui",
  inactive: "Tidak berlaku",
};

function WarrantiesPage() {
  const { activeGroup } = useAuth();
  const token = activeGroup?.token ?? "";
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: items = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["warranties", token],
    queryFn: () => fetchWarranties(token),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("id-ID");
    return items.filter((item) => {
      if (filter !== "all" && category(item, now) !== filter) return false;
      return !term || [item.trx_id, item.group_name, item.customer_name, item.product]
        .some((value) => value?.toLocaleLowerCase("id-ID").includes(term));
    });
  }, [items, filter, search, now]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Masa Aktif &amp; Garansi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hitung mundur sejak pesanan diproses. Garansi hanya berlaku setelah transaksi ditandai selesai.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={!token || isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Perbarui
        </Button>
      </div>

      {!token ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Pilih grup aktif terlebih dahulu.
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Cari transaksi, pelanggan, produk, atau grup" placeholder="Cari TRX, pelanggan, produk..." value={search}
                onChange={(event) => setSearch(event.target.value)} className="border-white/10 bg-white/5 pl-9" />
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as Filter)}>
              <SelectTrigger aria-label="Filter masa aktif dan garansi" className="w-[205px] border-white/10 bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-popover/95 backdrop-blur-xl">
                {(Object.keys(labels) as Filter[]).map((key) => (
                  <SelectItem key={key} value={key}>{labels[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Memuat masa aktif dan garansi...</p>
          ) : isError ? (
            <div role="alert" className="py-12 text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Gagal memuat data garansi."}
            </div>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "Belum ada pesanan dengan masa aktif." : "Tidak ada pesanan yang cocok dengan pencarian atau filter."}
            </p>
          ) : (
            <div className="space-y-3">
              {visible.map((item) => {
                const state = category(item, now);
                return (
                  <article key={item.trx_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium capitalize">{item.product || "Produk tidak diketahui"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{item.trx_id}</span> · {item.customer_name || "Pelanggan tidak diketahui"} · {item.group_name || activeGroup?.name || "Grup tidak diketahui"}
                        </div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                        state === "active" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" :
                        state === "expired" || state === "inactive" ? "border-red-400/20 bg-red-400/10 text-red-400" :
                        "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
                      }`}>
                        {state === "processing" ? "Belum selesai—garansi belum berlaku" : labels[state]}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                      <div>
                        <div className="text-muted-foreground">Durasi</div>
                        <div className="mt-1 font-medium">{item.duration_label || "Durasi belum diketahui"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Mulai · Berakhir</div>
                        <div className="mt-1 font-medium">{formatDate(item.started_at)} · {formatDate(item.expires_at)}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> Sisa masa aktif</div>
                        <div className="mt-1 font-mono font-medium" role="timer">{countdown(item.expires_at, now)}</div>
                      </div>
                    </div>
                    {state === "active" && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Transaksi selesai · garansi berlaku
                      </div>
                    )}
                    {state === "unknown" && (
                      <p className="mt-3 text-xs text-muted-foreground">Transaksi selesai, tetapi durasi atau tanggal berakhir belum diketahui; masa garansi belum dapat ditentukan.</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
