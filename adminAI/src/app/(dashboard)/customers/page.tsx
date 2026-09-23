"use client";

import { useState } from "react";
import { Users, Search, Phone, Tag, ShoppingBag, MessageSquare, Calendar } from "lucide-react";
import { mockStore } from "@/lib/mockStore";
import { CustomerItem } from "@/types";
import { formatDate, formatIDR } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>(mockStore.getCustomers());
  const [search, setSearch] = useState("");
  const [selectedCust, setSelectedCust] = useState<CustomerItem | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsappNumber.includes(search)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" /> Database Pelanggan DitsStore
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Daftar kontak WhatsApp customer, riwayat transaksi, tag pelanggan, dan AI summary memory.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pelanggan berdasarkan nama atau No. WhatsApp..."
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">No. WhatsApp</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Total Spending</th>
                <th className="p-4">Tags</th>
                <th className="p-4">Kontak Terakhir</th>
                <th className="p-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-800/30 transition cursor-pointer" onClick={() => setSelectedCust(cust)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                        {cust.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{cust.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{cust.notes || "Belum ada catatan"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-indigo-400 text-xs">
                    {cust.whatsappNumber}
                  </td>
                  <td className="p-4 font-semibold text-slate-200">
                    {cust.totalOrders} Pesanan
                  </td>
                  <td className="p-4 font-bold text-emerald-400">
                    {formatIDR(cust.totalSpending)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {cust.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-[11px] text-slate-400">
                    {formatDate(cust.lastContact)}
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg">
                      Lihat Profil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
