"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Bot,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { mockStore } from "@/lib/mockStore";
import { ProductItem } from "@/types";
import { formatIDR } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(mockStore.getProducts());
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Partial<ProductItem>>({
    name: "",
    price: 0,
    stock: 0,
    sku: "",
    description: "",
    status: "AVAILABLE",
    warrantyInfo: "Garansi 30 Hari",
    notesForAi: "",
  });

  const handleSaveProduct = () => {
    if (!editingProd.name || !editingProd.price) return;
    const newProd = mockStore.saveProduct({
      id: editingProd.id || `prod-${Date.now()}`,
      name: editingProd.name!,
      price: Number(editingProd.price),
      stock: Number(editingProd.stock || 0),
      sku: editingProd.sku || `SKU-${Date.now().toString().slice(-4)}`,
      description: editingProd.description || "",
      status: editingProd.status as any || "AVAILABLE",
      warrantyInfo: editingProd.warrantyInfo || "",
      notesForAi: editingProd.notesForAi || "",
      createdAt: editingProd.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setProducts([...mockStore.getProducts()]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus produk ini?")) {
      mockStore.deleteProduct(id);
      setProducts([...mockStore.getProducts()]);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" /> Management Produk DitsStore
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Produk, harga, dan stok yang dikelola di sini akan secara langsung dibaca oleh AI Assistant saat menjawab customer.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProd({
              name: "",
              price: 30000,
              stock: 10,
              sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              description: "",
              status: "AVAILABLE",
              warrantyInfo: "Garansi 30 Hari",
              notesForAi: "",
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk berdasarkan nama atau SKU..."
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="p-4">SKU / Produk</th>
                <th className="p-4">Harga</th>
                <th className="p-4">Stok</th>
                <th className="p-4">Status</th>
                <th className="p-4">Catatan untuk AI</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4">
                    <div className="font-bold text-white text-xs">{prod.name}</div>
                    <div className="text-[10px] text-indigo-400 font-mono mt-0.5">{prod.sku}</div>
                    <div className="text-[11px] text-slate-400 mt-1 max-w-sm line-clamp-1">{prod.description}</div>
                  </td>
                  <td className="p-4 font-bold text-emerald-400 text-xs">
                    {formatIDR(prod.price)}
                  </td>
                  <td className="p-4">
                    <span className={`font-semibold ${prod.stock > 0 ? "text-white" : "text-rose-400"}`}>
                      {prod.stock} unit
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.status === "AVAILABLE" && prod.stock > 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : prod.status === "OUT_OF_STOCK" || prod.stock === 0
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {prod.stock === 0 ? "OUT_OF_STOCK" : prod.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-[11px] text-slate-400 italic max-w-xs flex items-start gap-1">
                      <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{prod.notesForAi || "Tidak ada instruksi khusus AI"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingProd(prod);
                        setShowModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editingProd.id ? "Edit Produk DitsStore" : "Tambah Produk Baru"}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nama Produk</label>
                <input
                  type="text"
                  value={editingProd.name || ""}
                  onChange={(e) => setEditingProd({ ...editingProd, name: e.target.value })}
                  placeholder="Misal: ChatGPT Plus (1 Bulan)"
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">SKU Produk</label>
                <input
                  type="text"
                  value={editingProd.sku || ""}
                  onChange={(e) => setEditingProd({ ...editingProd, sku: e.target.value })}
                  placeholder="GPT-PLUS-01"
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Harga (IDR)</label>
                <input
                  type="number"
                  value={editingProd.price || 0}
                  onChange={(e) => setEditingProd({ ...editingProd, price: Number(e.target.value) })}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Stok</label>
                <input
                  type="number"
                  value={editingProd.stock || 0}
                  onChange={(e) => setEditingProd({ ...editingProd, stock: Number(e.target.value) })}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Deskripsi Produk</label>
                <textarea
                  value={editingProd.description || ""}
                  onChange={(e) => setEditingProd({ ...editingProd, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-indigo-400 mb-1 font-semibold flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> Notes / Instruksi Khusus untuk AI
                </label>
                <textarea
                  value={editingProd.notesForAi || ""}
                  onChange={(e) => setEditingProd({ ...editingProd, notesForAi: e.target.value })}
                  placeholder="Contoh: Selalu informasikan bahwa stok baru saja di-restock tadi pagi."
                  rows={2}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
