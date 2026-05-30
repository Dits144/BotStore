import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  type Product,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export const Route = createFileRoute("/dashboard/price-list")({
  component: PriceListPage,
});

type FormState = Omit<Product, "id">;
const empty: FormState = {
  name: "",
  price: 0,
  description: "",
  category: "",
  inStock: true,
  fastDelivery: false,
  isRare: false,
};

function PriceListPage() {
  const { activeGroup } = useAuth();
  const token = activeGroup?.token ?? "";
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", token],
    queryFn: () => fetchProducts(token),
    enabled: !!token,
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [products, query]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["products", token] });

  const createMut = useMutation({
    mutationFn: (input: FormState) => createProduct(token, input),
    onSuccess: () => {
      invalidate();
      toast.success("Produk berhasil ditambahkan");
      reset();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menambahkan produk"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Product> }) =>
      updateProduct(token, id, patch),
    onSuccess: () => {
      invalidate();
      toast.success("Produk berhasil diperbarui");
      reset();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal memperbarui produk"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(token, id),
    onSuccess: () => {
      invalidate();
      toast.success("Produk berhasil dihapus");
    },
  });

  function reset() {
    setOpen(false);
    setEditing(null);
    setForm(empty);
  }

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      inStock: p.inStock,
      fastDelivery: p.fastDelivery,
      isRare: p.isRare,
    });
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.price < 0) {
      toast.error("Silakan isi nama dan harga yang valid.");
      return;
    }
    if (editing) updateMut.mutate({ id: editing.id, patch: form });
    else createMut.mutate(form);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Daftar Harga</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola produk untuk{" "}
            <span className="text-foreground/80">{activeGroup?.name}</span>.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="h-11 rounded-xl bg-primary text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-[0_10px_40px_-10px_oklch(0.78_0.18_155_/_0.5)]"
            >
              <Plus className="h-4 w-4" /> Tambah produk
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-white/10 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit produk" : "Tambah produk baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama produk</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="1"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-white/5"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="bg-white/5"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Deskripsi</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="resize-none bg-white/5"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={reset}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {editing ? "Simpan perubahan" : "Tambah produk"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass rounded-2xl p-2 sm:p-4 animate-fade-in-up">
        <div className="flex items-center gap-3 px-2 pb-3 pt-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari produk…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-white/5 pl-9"
            />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} dari {products.length}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Memuat produk…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Tidak ada produk yang cocok dengan pencarian Anda.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <TableCell className="py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {p.description || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs">
                      {p.category || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    Rp{p.price.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        p.inStock
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {p.inStock ? "Tersedia" : "Habis"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMut.mutate(p.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
