"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Terminal,
  Key,
  Bot,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import { mockStore } from "@/lib/mockStore";

export default function WhatsAppPage() {
  const [connectionState, setConnectionState] = useState<
    "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "QR_READY"
  >("DISCONNECTED");
  const [connected, setConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // Fetch status on load
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const json = await res.json();
      if (json.success && json.data) {
        setConnectionState(json.data.connectionState);
        setConnected(json.data.connected);
        setQrCodeUrl(json.data.qrCodeUrl || null);
        setPhoneNumber(json.data.phoneNumber || null);
      }
    } catch (e) {
      console.error("Fetch status error:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Load current API key from settings
    const settings = mockStore.getSettings();
    if (settings.apiKey) {
      setApiKey(settings.apiKey);
    }

    setLogs(mockStore.getLogs().filter((l) => l.event.startsWith("WHATSAPP")));
  }, []);

  // Auto poll status when connecting or waiting for QR scan
  useEffect(() => {
    let interval: any;
    if (connectionState === "CONNECTING" || connectionState === "QR_READY" || !connected) {
      interval = setInterval(() => {
        fetchStatus();
        setLogs(mockStore.getLogs().filter((l) => l.event.startsWith("WHATSAPP")));
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionState, connected]);

  const handleStartConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/status", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setConnectionState(json.data.connectionState);
        setConnected(json.data.connected);
        setQrCodeUrl(json.data.qrCodeUrl || null);
        setPhoneNumber(json.data.phoneNumber || null);
      }
    } catch (err) {
      console.error("Start connection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      setConnectionState("DISCONNECTED");
      setConnected(false);
      setQrCodeUrl(null);
      setPhoneNumber(null);
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return;
    mockStore.updateSettings({ apiKey: apiKey.trim() });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" /> WhatsApp Gateway Connection (Baileys Engine)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Hubungkan nomor WhatsApp Admin CS DitsStore sebagai AI Assistant otomatis yang membalas Personal Chat pelanggan.
        </p>
      </div>

      {/* Connection Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
                connected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ring-4 ring-emerald-500/10"
                  : connectionState === "QR_READY"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Status WA Admin CS</h3>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    connected
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : connectionState === "QR_READY"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : connectionState === "CONNECTING"
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  ● {connected ? "CONNECTED" : connectionState}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                {connected ? (
                  <>
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Terhubung: <strong className="text-white">+{phoneNumber || "62812345678"}</strong> (Nomor Admin CS Aktif)</span>
                  </>
                ) : connectionState === "QR_READY" ? (
                  "Silakan Pindai Kode QR di bawah untuk menghubungkan WhatsApp..."
                ) : (
                  "Nomor WhatsApp Admin CS belum terhubung. Klik tombol untuk memulai."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!connected ? (
              <button
                onClick={handleStartConnection}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading || connectionState === 'CONNECTING' ? 'animate-spin' : ''}`} />
                {connectionState === "QR_READY" ? "Refresh QR Code" : "Mulai / Pindai QR Code"}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* QR Code Container */}
        {qrCodeUrl && !connected && (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1">
                🟡 Scan QR Code Pasangan WA Admin CS
              </span>
              <p className="text-xs text-slate-300">
                Pindai Kode QR berikut untuk menghubungkan nomor WhatsApp Admin sebagai AI CS otomatis.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-2xl ring-4 ring-indigo-500/20">
              <img src={qrCodeUrl} alt="WhatsApp Admin QR Code" className="w-56 h-56" />
            </div>

            <div className="text-[11px] text-slate-400 text-center max-w-sm space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="font-semibold text-slate-300">Langkah Menghubungkan:</p>
              <ol className="list-decimal list-inside text-left space-y-0.5 text-slate-400">
                <li>Buka aplikasi <strong>WhatsApp</strong> di HP Anda.</li>
                <li>Buka menu titik tiga (Atas) &gt; <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                <li>Ketuk <strong>Tautkan Perangkat</strong>.</li>
                <li>Arahkan kamera ke Kode QR di atas.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Connected Success Alert */}
        {connected && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">WhatsApp Admin CS Terhubung & Aktif!</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Pesan pribadi pelanggan yang masuk ke nomor ini akan dibalas secara otomatis oleh AI Assistant DitsStore.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Gemini API Key Configuration Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Google Gemini API Key Integration</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
            {apiKey ? "Gemini Key Configured" : "Fallback Mode"}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Masukkan Google Gemini API Key Anda agar AI Assistant dapat merespons balasan pelanggan menggunakan model AI Gemini Flash resmi.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy... (Masukkan Google Gemini API Key)"
            className="flex-1 bg-slate-950 text-xs text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-mono"
          />
          <button
            onClick={handleSaveApiKey}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {keySaved ? "Tersimpan!" : "Simpan Key"}
          </button>
        </div>

        {keySaved && (
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> API Key berhasil disimpan & diaktifkan untuk AI Assistant!
          </p>
        )}
      </div>

      {/* Connection Logs */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" /> Audit Log Event WhatsApp Gateway
        </h3>

        <div className="space-y-2 text-xs">
          {logs.length > 0 ? (
            logs.map((l) => (
              <div
                key={l.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-850 font-mono text-[11px] text-slate-400 flex items-center justify-between"
              >
                <span>
                  [{new Date(l.timestamp).toLocaleTimeString()}] Event: <strong>{l.event}</strong> | {JSON.stringify(l.metadata)}
                </span>
                <span className={l.status === "SUCCESS" ? "text-emerald-400" : "text-indigo-400"}>
                  {l.status}
                </span>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-xl bg-slate-950 text-slate-500 text-[11px] text-center italic">
              Belum ada log koneksi. Klik "Mulai / Pindai QR Code" di atas untuk menghubungkan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
