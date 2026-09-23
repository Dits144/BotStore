"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { mockStore } from "@/lib/mockStore";
import { KnowledgeItem } from "@/types";

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(mockStore.getKnowledge());
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<KnowledgeItem>>({
    title: "",
    category: "FAQ",
    content: "",
    keywords: [],
    status: "ACTIVE",
  });

  const handleSave = () => {
    if (!editingItem.title || !editingItem.content) return;
    mockStore.saveKnowledge({
      id: editingItem.id || `kb-${Date.now()}`,
      title: editingItem.title!,
      category: editingItem.category || "FAQ",
      content: editingItem.content!,
      keywords: typeof editingItem.keywords === "string" 
        ? (editingItem.keywords as string).split(",").map(k => k.trim()) 
        : editingItem.keywords || [],
      status: editingItem.status as any || "ACTIVE",
      createdAt: editingItem.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setKnowledge([...mockStore.getKnowledge()]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus artikel Knowledge Base ini?")) {
      mockStore.deleteKnowledge(id);
      setKnowledge([...mockStore.getKnowledge()]);
    }
  };

  const filtered = knowledge.filter(
    (k) =>
      k.title.toLowerCase().includes(search.toLowerCase()) ||
      k.content.toLowerCase().includes(search.toLowerCase()) ||
      k.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Knowledge Base AI DitsStore
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sumber pengetahuan resmi AI Assistant untuk menjawab pertanyaan seputar kebijakan toko, cara bayar, klaim garansi, dan SOP customer service.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem({
              title: "",
              category: "FAQ",
              content: "",
              keywords: [],
              status: "ACTIVE",
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" /> Tambah Knowledge Item
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari topik, kata kunci, atau kebijakan..."
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                  {item.category}
                </span>
                <h3 className="font-bold text-sm text-white mt-1.5">{item.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setShowModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              {item.content}
            </p>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <div className="flex items-center gap-1 text-slate-400 flex-wrap">
                <Tag className="w-3 h-3 text-slate-500" />
                {item.keywords.map((kw) => (
                  <span key={kw} className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                    {kw}
                  </span>
                ))}
              </div>
              <span className={`font-semibold ${item.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500'}`}>
                ● {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editingItem.id ? "Edit Knowledge Item" : "Tambah Knowledge Item Baru"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Judul Kebijakan / Topik</label>
                <input
                  type="text"
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Misal: Cara Pemesanan & Pembayaran QRIS"
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Kategori</label>
                  <select
                    value={editingItem.category || "FAQ"}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FAQ">FAQ</option>
                    <option value="Payment">Payment</option>
                    <option value="Warranty">Warranty</option>
                    <option value="Refund">Refund</option>
                    <option value="Store Policy">Store Policy</option>
                    <option value="Technical Support">Technical Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Status</label>
                  <select
                    value={editingItem.status || "ACTIVE"}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                    className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Konten Jawaban AI / Penjelasan Lengkap</label>
                <textarea
                  value={editingItem.content || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Keywords (pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={Array.isArray(editingItem.keywords) ? editingItem.keywords.join(", ") : editingItem.keywords || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, keywords: e.target.value as any })}
                  placeholder="qris, bca, transfer, cara bayar"
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
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                Simpan Knowledge Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
