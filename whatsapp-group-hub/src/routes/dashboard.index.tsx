import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ListOrdered,
  Package,
  TrendingUp,
  Zap,
} from "lucide-react";

import { useAuth } from "../lib/auth-context";
import { fetchProducts } from "../lib/api";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { activeGroup, session } = useAuth();
  const token = activeGroup?.token ?? "";

  const { data: products = [] } = useQuery({
    queryKey: ["products", token],
    queryFn: () => fetchProducts(token),
    enabled: !!token,
  });

  const inStock = products.filter((p) => p.inStock).length;
  const fast = products.filter((p) => p.fastDelivery).length;
  const oos = products.length - inStock;
  const avgPrice =
    products.length === 0
      ? 0
      : products.reduce((s, p) => s + p.price, 0) / products.length;

  const stats = [
    {
      label: "Total Produk",
      value: products.length,
      icon: ListOrdered,
      hint: "dalam katalog",
      tint: "from-primary/30 to-primary/0",
    },
    {
      label: "Stok Tersedia",
      value: inStock,
      icon: Package,
      hint: `${oos} habis`,
      tint: "from-success/30 to-success/0",
    },
    {
      label: "Pengiriman Cepat",
      value: fast,
      icon: Zap,
      hint: "kilat aktif",
      tint: "from-warning/30 to-warning/0",
    },
    {
      label: "Rata-rata Harga",
      value: `Rp${avgPrice.toLocaleString("id-ID")}`,
      icon: TrendingUp,
      hint: "di seluruh katalog",
      tint: "from-accent/30 to-accent/0",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="animate-fade-in-up">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Live · {activeGroup?.name ?? "Tidak ada grup"}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Selamat datang kembali,{" "}
          <span className="text-gradient">
            {session?.email.split("@")[0]}
          </span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Berikut adalah ringkasan performa toko bot Anda. Anda dapat beralih grup kapan saja
          melalui pemilih di bagian atas — setiap perubahan disesuaikan dengan grup aktif.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group glass relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-20px_oklch(0_0_0_/_0.6)] animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${s.tint} blur-2xl`}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              <s.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <QuickAction
          to="/dashboard/price-list"
          icon={<ListOrdered className="h-5 w-5" />}
          title="Kelola daftar harga"
          body="Tambah, ubah, atau hapus produk dan kategori untuk grup ini."
        />
        <QuickAction
          to="/dashboard/stock"
          icon={<Package className="h-5 w-5" />}
          title="Perbarui stok"
          body="Atur ketersediaan dan status pengiriman cepat secara langsung ke bot."
        />
        <QuickAction
          to="/dashboard/settings"
          icon={<Zap className="h-5 w-5" />}
          title="Pengaturan grup"
          body="Kelola grup terhubung, akun, dan preferensi koneksi."
        />
      </section>

      <section className="glass rounded-2xl p-5 animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Produk terbaru
          </h2>
          <Link
            to="/dashboard/price-list"
            className="text-xs text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="grid gap-2">
          {products.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.category}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    p.inStock
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {p.inStock ? "Tersedia" : "Habis"}
                </span>
                {p.fastDelivery && (
                  <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
                    <Zap className="h-3 w-3" /> Kilat
                  </span>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
              Belum ada produk — tambahkan produk pertama Anda di Daftar Harga.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  body,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group glass relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div className="mt-4 text-base font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
