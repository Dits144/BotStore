"use client";

import { useState } from "react";
import { Bot, Save, Sparkles, Sliders, ShieldCheck, Check } from "lucide-react";
import { mockStore } from "@/lib/mockStore";
import { AiSettings } from "@/types";

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings>(mockStore.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    mockStore.updateSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" /> AI Settings & System Prompt Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi model AI Google Gemini, kepribadian assistant, batas ambang handover, dan aturan bisnis DitsStore.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
        >
          <Save className="w-4 h-4" /> {savedSuccess ? "Tersimpan!" : "Simpan Pengaturan"}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" /> Pengaturan AI Assistant berhasil diperbarui dan langsung aktif!
        </div>
      )}

      {/* Main Form Cards */}
      <div className="space-y-4">
        {/* Core AI Toggle & Model */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" /> Control Engine & AI Model
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <p className="font-semibold text-slate-200">AI Assistant Enabled</p>
                <p className="text-[11px] text-slate-400">Aktifkan atau nonaktifkan respon otomatis AI</p>
              </div>
              <input
                type="checkbox"
                checked={settings.aiEnabled}
                onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Model Gemini AI</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Sangat Cepat & Stabil - Recommended)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Reasoning Mendalam)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Default Mode Percakapan Baru</label>
              <select
                value={settings.defaultMode}
                onChange={(e) => setSettings({ ...settings, defaultMode: e.target.value as any })}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="AUTO">AUTO (AI Balas Otomatis)</option>
                <option value="ASSIST">ASSIST (AI Buat Draf Sugesti)</option>
                <option value="MANUAL">MANUAL (Hanya Admin Manusia)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Auto Handover Confidence Threshold</label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="1.0"
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings({ ...settings, confidenceThreshold: Number(e.target.value) })}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500">Handover jika kepastian AI di bawah nilai ini (misal 0.75)</span>
            </div>
          </div>
        </div>

        {/* Business Identity & Personality */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Identitas & Gaya Bahasa Persona
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Nama Toko / Bisnis</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Nama AI Assistant</label>
              <input
                type="text"
                value={settings.assistantName}
                onChange={(e) => setSettings({ ...settings, assistantName: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Gaya Bahasa & Kepribadian (AI Personality)</label>
              <textarea
                value={settings.personality}
                onChange={(e) => setSettings({ ...settings, personality: e.target.value })}
                rows={3}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-indigo-400 mb-1 font-semibold">Instruksi Sistem Tambahan (System Instructions)</label>
              <textarea
                value={settings.systemInstructions}
                onChange={(e) => setSettings({ ...settings, systemInstructions: e.target.value })}
                rows={3}
                placeholder="Misal: Dilarang menyebut toko lain. Gunakan emoji secukupnya."
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
