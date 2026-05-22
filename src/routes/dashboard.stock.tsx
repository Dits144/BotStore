import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, Search, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import { fetchProducts, updateProduct, type Product } from "../lib/api";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";

export const Route = createFileRoute("/dashboard/stock")({
  component: StockPage,
});

function StockPage() {
  const { activeGroup } = useAuth();
  const token = activeGroup?.token ?? "";
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", token],
    queryFn: () => fetchProducts(token),
    enabled: !!token,
  });

  const mut = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Product>;
      key: string;
    }) => updateProduct(token, id, patch),
    onMutate: async ({ id, patch, key }) => {
      setPending((p) => ({ ...p, [key]: true }));
      await qc.cancelQueries({ queryKey: ["products", token] });
      const prev = qc.getQueryData<Product[]>(["products", token]);
      qc.setQueryData<Product[]>(["products", token], (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["products", token], ctx.prev);
      toast.error("Failed to sync — restored previous state.");
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.patch.inStock !== undefined
          ? `${vars.patch.inStock ? "Marked in stock" : "Marked out of stock"}`
          : `Fast delivery ${vars.patch.fastDelivery ? "enabled" : "disabled"}`,
      );
    },
    onSettled: (_d, _e, vars) => {
      setPending((p) => {
        const { [vars.key]: _, ...rest } = p;
        return rest;
      });
      qc.invalidateQueries({ queryKey: ["products", token] });
    },
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  const inStockCount = products.filter((p) => p.inStock).length;
  const fastCount = products.filter((p) => p.fastDelivery).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-semibold tracking-tight">
          Stock Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time toggles sync to your bot. Changes scoped to{" "}
          <span className="text-foreground/80">{activeGroup?.name}</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 animate-fade-in-up">
        <Pill icon={<Package className="h-4 w-4" />} label="Total" value={products.length} />
        <Pill
          icon={<span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px] shadow-success" />}
          label="In stock"
          value={inStockCount}
        />
        <Pill
          icon={<Zap className="h-4 w-4 text-warning" />}
          label="Fast delivery"
          value={fastCount}
        />
      </div>

      <div className="glass rounded-2xl p-4 animate-fade-in-up">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Find a product…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-white/5 pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          {isLoading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading stock…
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
              No products to manage yet.
            </div>
          )}
          {filtered.map((p, i) => {
            const stockKey = `${p.id}:stock`;
            const fastKey = `${p.id}:fast`;
            const stockBusy = pending[stockKey];
            const fastBusy = pending[fastKey];
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {p.category}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    ${p.price.toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <ToggleRow
                    label={p.inStock ? "In Stock" : "Out of Stock"}
                    accent={p.inStock ? "success" : "destructive"}
                    busy={stockBusy}
                    checked={p.inStock}
                    onChange={(v) =>
                      mut.mutate({ id: p.id, patch: { inStock: v }, key: stockKey })
                    }
                    icon={
                      <span
                        className={`h-2 w-2 rounded-full transition-colors ${
                          p.inStock
                            ? "bg-success shadow-[0_0_8px] shadow-success"
                            : "bg-muted"
                        }`}
                      />
                    }
                  />

                  <ToggleRow
                    label="Fast Delivery"
                    accent="warning"
                    busy={fastBusy}
                    checked={p.fastDelivery}
                    onChange={(v) =>
                      mut.mutate({
                        id: p.id,
                        patch: { fastDelivery: v },
                        key: fastKey,
                      })
                    }
                    icon={
                      <Zap
                        className={`h-3.5 w-3.5 transition-all ${
                          p.fastDelivery
                            ? "text-warning drop-shadow-[0_0_6px_oklch(0.82_0.17_85_/_0.6)]"
                            : "text-muted-foreground"
                        }`}
                      />
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  accent,
  checked,
  onChange,
  icon,
  busy,
}: {
  label: string;
  accent: "success" | "destructive" | "warning";
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  busy?: boolean;
}) {
  const tone =
    accent === "success"
      ? "data-[state=checked]:bg-success"
      : accent === "warning"
        ? "data-[state=checked]:bg-warning"
        : "data-[state=checked]:bg-destructive";

  return (
    <label className="flex min-w-[170px] cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 transition-all hover:border-white/10">
      <span className="flex items-center gap-2 text-xs font-medium">
        {icon}
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={busy}
          className={`transition-all ${tone}`}
        />
      </span>
    </label>
  );
}

function Pill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="glass flex items-center justify-between rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
