"use client";

import { Settings as SettingsIcon, Save, Shield, User } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-400" /> Pengaturan Sistem DitsStore AI
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Pengaturan akun admin, hak akses, dan preferensi aplikasi.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <User className="w-4 h-4 text-indigo-400" /> Profil Admin
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Nama Admin</label>
            <input
              type="text"
              defaultValue="DitsStore Admin"
              className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Email</label>
            <input
              type="email"
              defaultValue="admin@ditsstore.com"
              className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
