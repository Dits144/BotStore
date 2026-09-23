"use client";

import { useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  UserCheck,
  ShieldAlert,
  Search,
  CheckCheck,
  Tag,
  ShoppingBag,
  RotateCcw,
  UserX,
  Edit2,
  Trash2,
  ChevronRight,
  Info,
} from "lucide-react";
import { mockStore } from "@/lib/mockStore";
import { ConversationItem, MessageItem } from "@/types";
import { formatIDR, formatTime } from "@/lib/utils";

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>(mockStore.getConversations());
  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || "");
  const [filterMode, setFilterMode] = useState<string>("ALL");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [editingSuggested, setEditingSuggested] = useState<boolean>(false);
  const [suggestedText, setSuggestedText] = useState<string>("");

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeConv) return;

    // Add Admin message
    const newMsg = mockStore.addMessage(activeConv.id, {
      sender: "ADMIN",
      content: inputMessage,
      status: "SENT",
    });

    setInputMessage("");
    setConversations([...mockStore.getConversations()]);
  };

  const handleTakeover = (mode: "MANUAL" | "AUTO" | "ASSIST") => {
    if (!activeConv) return;
    mockStore.updateConversationMode(
      activeConv.id,
      mode,
      mode === "MANUAL" ? "Admin clicked Take Over" : undefined
    );
    setConversations([...mockStore.getConversations()]);
  };

  const handleSendSuggested = (textToSend: string) => {
    if (!activeConv) return;
    mockStore.addMessage(activeConv.id, {
      sender: "ADMIN",
      content: textToSend,
      status: "SENT",
    });
    // clear suggested reply
    const msg = activeConv.messages?.[activeConv.messages.length - 1];
    if (msg) msg.suggestedReply = null;
    setEditingSuggested(false);
    setConversations([...mockStore.getConversations()]);
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterMode === "ALL") return true;
    return c.mode === filterMode;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 text-slate-100">
      {/* COLUMN 1: Conversation List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col min-w-0">
        {/* Header & Filter Tabs */}
        <div className="p-3 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-200">Inbox Customer Service</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-semibold border border-slate-700">
              {conversations.length} Active
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              className="w-full bg-slate-800/70 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700/50 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            {["ALL", "AUTO", "ASSIST", "MANUAL"].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`flex-1 py-1 rounded-md font-medium transition ${
                  filterMode === m
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredConversations.map((conv) => {
            const lastMsg = conv.messages?.[conv.messages.length - 1];
            const isSelected = conv.id === activeConvId;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`p-3.5 cursor-pointer transition flex items-start gap-3 hover:bg-slate-800/40 ${
                  isSelected ? "bg-indigo-950/40 border-l-4 border-indigo-500" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-indigo-400 text-xs font-bold flex items-center justify-center border border-slate-700">
                    {conv.customer.name.slice(0, 2).toUpperCase()}
                  </div>
                  {conv.requiresAttention && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 ring-2 ring-slate-900 animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200 truncate">{conv.customer.name}</h3>
                    <span className="text-[10px] text-slate-500">
                      {lastMsg ? formatTime(lastMsg.createdAt) : ""}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {lastMsg ? lastMsg.content : "Belum ada pesan"}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        conv.mode === "AUTO"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : conv.mode === "ASSIST"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {conv.mode}
                    </span>

                    {conv.requiresAttention && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                        Attention Needed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: Active Chat Window */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
          {/* Chat Window Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 text-indigo-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                {activeConv.customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {activeConv.customer.name}
                  <span className="text-[11px] font-normal text-slate-400">({activeConv.customer.whatsappNumber})</span>
                </h2>
                <p className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Status Mode:</span>
                  <span className={`font-semibold ${
                    activeConv.mode === 'AUTO' ? 'text-emerald-400' :
                    activeConv.mode === 'ASSIST' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {activeConv.mode}
                  </span>
                </p>
              </div>
            </div>

            {/* Mode Controls & Takeover */}
            <div className="flex items-center gap-2">
              {activeConv.mode === "MANUAL" ? (
                <button
                  onClick={() => handleTakeover("AUTO")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Return to AI
                </button>
              ) : (
                <button
                  onClick={() => handleTakeover("MANUAL")}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Take Over
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {activeConv.requiresAttention && activeConv.handoverReason && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Handover Triggered:</strong> {activeConv.handoverReason}
                </span>
              </div>
            )}

            {(activeConv.messages || []).map((msg) => {
              const isCustomer = msg.sender === "CUSTOMER";
              const isAI = msg.sender === "AI";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1">
                    {isCustomer ? (
                      <span>{activeConv.customer.name}</span>
                    ) : isAI ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Bot className="w-3 h-3" /> Gemini AI
                      </span>
                    ) : (
                      <span className="text-indigo-400 font-semibold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                    <span>• {formatTime(msg.createdAt)}</span>
                  </div>

                  <div
                    className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isCustomer
                        ? "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/60"
                        : isAI
                        ? "bg-emerald-950/50 text-emerald-100 border border-emerald-500/30 rounded-tr-sm"
                        : "bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* AI Suggested Reply Component (in ASSIST mode or when suggestion exists) */}
                  {msg.suggestedReply && activeConv.mode === "ASSIST" && (
                    <div className="mt-2 w-full max-w-[85%] p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-semibold text-[11px] text-amber-400">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> AI Suggested Reply
                        </span>
                        <span>ASSIST Mode</span>
                      </div>

                      {editingSuggested ? (
                        <textarea
                          value={suggestedText || msg.suggestedReply}
                          onChange={(e) => setSuggestedText(e.target.value)}
                          className="w-full bg-slate-900 text-slate-100 p-2 rounded border border-amber-500/50 text-xs focus:outline-none"
                          rows={3}
                        />
                      ) : (
                        <p className="text-slate-300 italic">{msg.suggestedReply}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setEditingSuggested(!editingSuggested);
                            setSuggestedText(msg.suggestedReply || "");
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px] flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> {editingSuggested ? "Done Editing" : "Edit"}
                        </button>

                        <button
                          onClick={() => handleSendSuggested(editingSuggested ? suggestedText : msg.suggestedReply!)}
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Send to Customer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  activeConv.mode === "AUTO"
                    ? "Mode AUTO aktif (AI membalas otomatis). Ketik di sini untuk kirim sebagai Admin..."
                    : "Ketik pesan balasan admin..."
                }
                className="flex-1 bg-slate-800 text-xs text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-700/60 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
              >
                <Send className="w-3.5 h-3.5" /> Kirim
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          Pilih percakapan untuk memulai
        </div>
      )}

      {/* COLUMN 3: Customer Context & AI Memory Drawer */}
      {activeConv && (
        <div className="w-80 border-l border-slate-800 bg-slate-900/60 p-4 space-y-5 overflow-y-auto hidden lg:block">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Customer Profile</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-indigo-400 font-bold text-base flex items-center justify-center border border-slate-700">
                {activeConv.customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{activeConv.customer.name}</h4>
                <p className="text-xs text-slate-400">{activeConv.customer.whatsappNumber}</p>
              </div>
            </div>
          </div>

          {/* Tag List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Customer Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeConv.customer.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400">Total Orders</span>
              <p className="text-sm font-bold text-white mt-0.5">{activeConv.customer.totalOrders}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400">Total Spending</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatIDR(activeConv.customer.totalSpending)}</p>
            </div>
          </div>

          {/* AI Memory Summary */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Memory Summary
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{activeConv.customer.notes || "Pelanggan sering membeli langganan produk AI (ChatGPT & Claude). Pembayaran rutin via QRIS."}"
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Admin Notes</span>
            <textarea
              defaultValue={activeConv.customer.notes || ""}
              placeholder="Tambah catatan internal..."
              className="w-full bg-slate-800 text-xs text-slate-200 p-2.5 rounded-lg border border-slate-700/50 focus:outline-none focus:border-indigo-500"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  );
}
