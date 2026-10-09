import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import {
  ArrowRight,
  Bolt,
  Boxes,
  CircleAlert,
  ListOrdered,
  PackageCheck,
  PackageX,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";

import { useAuth } from "../lib/auth-context";
import { fetchProducts } from "../lib/api";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: (search: Record<string, unknown>) => ({
    linkToken: (search.linkToken as string) || undefined,
  }),
  component: DashboardPageRouter,
});

const PriceListPage = lazy(() =>
  import("../pages/price-list").then((module) => ({ default: module.PriceListPage })),
);
const StockPage = lazy(() =>
  import("../pages/stock").then((module) => ({ default: module.StockPage })),
);
const TransactionsPage = lazy(() =>
  import("../pages/transactions").then((module) => ({ default: module.TransactionsPage })),
);
const PaymentPage = lazy(() =>
  import("../pages/payment").then((module) => ({ default: module.PaymentSettingsPage })),
);
const GroupToolsPage = lazy(() =>
  import("../pages/group-tools").then((module) => ({ default: module.GroupToolsPage })),
);
const RentalsPage = lazy(() =>
  import("../pages/rentals").then((module) => ({ default: module.RentalsPage })),
);
const SettingsPage = lazy(() =>
  import("../pages/settings").then((module) => ({ default: module.SettingsPage })),
);

function DashboardPageRouter() {
  const location = useLocation();
  const page = location.hash.replace(/^#/, "");

  let content: React.ReactNode;
  switch (page) {
    case "price-list":
      content = <PriceListPage />;
      break;
    case "stock":
      content = <StockPage />;
      break;
    case "transactions":
      content = <TransactionsPage />;
      break;
    case "payment":
      content = <PaymentPage />;
      break;
    case "group-tools":
      content = <GroupToolsPage />;
      break;
    case "rentals":
      content = <RentalsPage />;
      break;
    case "settings":
      content = <SettingsPage />;
      break;
    default:
      content = <DashboardHome />;
  }

  return <Suspense fallback={<DashboardPageSkeleton />}>{content}</Suspense>;
}

function DashboardPageSkeleton() {
  return (
    <div className="space-y-7" aria-label="Memuat halaman" aria-busy="true">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}

export function DashboardHome() {
  const { activeGroup, session } = useAuth();
  const token = activeGroup?.token ?? "";

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products", token],
    queryFn: () => fetchProducts(token),
    enabled: !!token,
  });

  const inStock = products.filter((product) => product.inStock).length;
  const fast = products.filter((product) => product.fastDelivery).length;
  const rare = products.filter((product) => product.isRare).length;
  const outOfStock = products.filter((product) => !product.inStock);

  const stats = [
    {
      label: "Total produk",
      value: products.length,
      icon: Boxes,
      hint: "Produk dalam katalog",
      tone: "primary",
    },
    {
      label: "Stok tersedia",
      value: inStock,
      icon: PackageCheck,
      hint: `${outOfStock.length} produk habis`,
      tone: "success",
    },
    {
      label: "Pengiriman cepat",
      value: fast,
      icon: Zap,
      hint: "Produk dengan layanan kilat",
      tone: "warning",
    },
    {
      label: "Produk langka",
      value: rare,
      icon: Sparkles,
      hint: "Ditandai sebagai rare item",
      tone: "info",
    },
  ] as const;

  if (!token) {
    return <EmptyWorkspace isOwner={session?.role === "owner"} />;
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in-up">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {activeGroup?.name}
          </div>
          <h1 className="text-[28px] font-bold leading-9 tracking-[-0.025em]">Ringkasan toko</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pantau produk, stok, dan kesiapan katalog dalam satu tempat.
          </p>
        </div>
        <Link
          to="/dashboard/"
          search={{ linkToken: undefined }}
          hash="price-list"
          hashScrollIntoView={false}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md sm:self-auto"
        >
          <ListOrdered className="h-4 w-4" /> Kelola katalog
        </Link>
      </header>

      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Data katalog belum dapat dimuat. Periksa koneksi lalu coba lagi.
        </div>
      )}

      <section aria-label="Metrik katalog" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <MetricCard key={stat.label} {...stat} loading={isLoading} delay={index * 45} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <div className="surface-panel overflow-hidden rounded-2xl animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold">Produk terbaru</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Lima item terakhir dari katalog aktif.
              </p>
            </div>
            <Link
              to="/dashboard/"
              search={{ linkToken: undefined }}
              hash="price-list"
              hashScrollIntoView={false}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))
            ) : products.length ? (
              products.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/60 sm:px-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{product.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {product.category || "Umum"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {product.fastDelivery && <StatusPill tone="warning" label="Kilat" />}
                    <StatusPill
                      tone={product.inStock ? "success" : "danger"}
                      label={product.inStock ? "Tersedia" : "Habis"}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Boxes className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">Katalog masih kosong</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tambahkan produk pertama agar toko siap digunakan.
                </p>
                <Link
                  to="/dashboard/"
                  search={{ linkToken: undefined }}
                  hash="price-list"
                  hashScrollIntoView={false}
                  className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
                >
                  Tambah produk
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-panel rounded-2xl p-5 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Perlu perhatian</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Status stok katalog aktif.</p>
              </div>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${outOfStock.length ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
              >
                {outOfStock.length ? (
                  <PackageX className="h-4 w-4" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums">{outOfStock.length}</span>
              <span className="pb-1 text-sm text-muted-foreground">produk habis</span>
            </div>
            <Link
              to="/dashboard/"
              search={{ linkToken: undefined }}
              hash="stock"
              hashScrollIntoView={false}
              className="mt-5 flex h-10 w-full items-center justify-between rounded-[10px] bg-secondary px-3.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Perbarui status stok <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>

          <div className="surface-panel rounded-2xl p-5 animate-fade-in-up">
            <h2 className="text-sm font-semibold">Aksi cepat</h2>
            <div className="mt-3 space-y-1">
              <QuickLink hash="price-list" icon={ListOrdered} label="Kelola daftar harga" />
              <QuickLink hash="stock" icon={PackageCheck} label="Perbarui stok" />
              <QuickLink hash="group-tools" icon={Bolt} label="Buka alat grup" />
              <QuickLink hash="settings" icon={Settings2} label="Pengaturan grup" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone,
  loading,
  delay,
}: {
  label: string;
  value: number;
  icon: typeof Boxes;
  hint: string;
  tone: "primary" | "success" | "warning" | "info";
  loading: boolean;
  delay: number;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };
  return (
    <div
      className="surface-panel rounded-2xl p-5 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-float)] animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${tones[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      {loading ? (
        <div className="mt-5 h-8 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <div className="mt-4 text-[30px] font-bold leading-9 tracking-[-0.03em] tabular-nums">
          {value}
        </div>
      )}
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function QuickLink({
  hash,
  icon: Icon,
  label,
}: {
  hash: string;
  icon: typeof Boxes;
  label: string;
}) {
  return (
    <Link
      to="/dashboard/"
      search={{ linkToken: undefined }}
      hash={hash}
      hashScrollIntoView={false}
      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function StatusPill({ tone, label }: { tone: "success" | "warning" | "danger"; label: string }) {
  const classes =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : "bg-destructive/10 text-destructive";
  return (
    <span
      className={`hidden rounded-full px-2 py-1 text-[11px] font-semibold sm:inline-flex ${classes}`}
    >
      {label}
    </span>
  );
}

function EmptyWorkspace({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="surface-panel mx-auto flex min-h-[420px] max-w-2xl flex-col items-center justify-center rounded-2xl px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Boxes className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-xl font-bold">Belum ada grup aktif</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Hubungkan grup WhatsApp untuk mulai mengelola katalog, stok, dan transaksi dari dasbor.
      </p>
      <Link
        to="/dashboard/"
        search={{ linkToken: undefined }}
        hash={isOwner ? "rentals" : "settings"}
        hashScrollIntoView={false}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        Siapkan grup <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
