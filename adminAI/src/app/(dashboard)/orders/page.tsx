"use client";

import { useState } from "react";
import { ShoppingBag, Search, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { mockStore } from "@/lib/mockStore";
import { OrderItemType } from "@/types";
import { formatDate, formatIDR } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItemType[]>(mockStore.getOrders());
  const [search, setSearch] = useState("");

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-400" /> Transaksi & Pesanan DitsStore
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Daftar pesanan produk digital pelanggan dari WhatsApp CS.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Order ID atau Nama Pelanggan..."
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Item Pesanan</th>
                <th className="p-4">Total Pembayaran</th>
                <th className="p-4">Status Order</th>
                <th className="p-4">Status Bayar</th>
                <th className="p-4">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-mono font-bold text-indigo-400">
                    {ord.id}
                  </td>
                  <td className="p-4 font-semibold text-white">
                    {ord.customerName || ord.customerId}
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      {ord.items?.map((it) => (
                        <div key={it.id} className="text-xs text-slate-200">
                          {it.productName} x{it.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-emerald-400">
                    {formatIDR(ord.totalAmount)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : ord.status === "WAITING_PAYMENT"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.paymentStatus === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-[11px] text-slate-400">
                    {formatDate(ord.createdAt)}
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
