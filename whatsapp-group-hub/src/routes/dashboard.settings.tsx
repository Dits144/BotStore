import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  LogOut,
  Plus,
  Radio,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  fetchQrisUrl,
  uploadQris,
  sendRentalReport,
} from "../lib/api";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { session, activeGroup, switchGroup, addGroup, logout } = useAuth();
  const navigate = useNavigate();
  const [newToken, setNewToken] = useState("");

  // States & handlers for QRIS & Rent Bot
  const [qrisUrl, setQrisUrl] = useState(fetchQrisUrl());
  const [uploadingQris, setUploadingQris] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  const packages = [
    { id: "1_bulan", name: "1 Bulan / Rp 10.000", days: 30 },
    { id: "3_bulan", name: "3 Bulan / Rp 25.000 (Hemat 15%!)", days: 90 },
    { id: "6_bulan", name: "6 Bulan / Rp 45.000 (Hemat 25%!)", days: 180 },
  ];

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploadingQris(true);
      try {
        await uploadQris(reader.result as string);
        toast.success("QRIS Owner berhasil diperbarui!");
        setQrisUrl(fetchQrisUrl());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui QRIS");
      } finally {
        setUploadingQris(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofBase64(reader.result as string);
      toast.success("Bukti transfer berhasil diunggah.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = async () => {
    if (!activeGroup) {
      toast.error("Pilih grup aktif terlebih dahulu di selector atas!");
      return;
    }
    if (!selectedPackage) {
      toast.error("Silakan pilih paket sewa terlebih dahulu!");
      return;
    }
    if (!proofBase64) {
      toast.error("Silakan unggah screenshot bukti transfer pembayaran!");
      return;
    }

    setSubmittingReport(true);
    try {
      const pkg = packages.find(p => p.id === selectedPackage);
      await sendRentalReport(activeGroup.token, pkg?.name || "1 Bulan", proofBase64);
      toast.success("Laporan sewa bot berhasil dikirim ke Owner untuk diverifikasi!");
      setProofBase64(null);
      setSelectedPackage(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirimkan laporan sewa");
    } finally {
      setSubmittingReport(false);
    }
  };

  if (!session) return null;

  async function onAdd() {
    if (!newToken.trim()) return;
    try {
      await addGroup(newToken.trim());
      setNewToken("");
      toast.success("Group linked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and linked WhatsApp groups.
        </p>
      </div>

      <section className="glass rounded-2xl p-6 animate-fade-in-up">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input readOnly value={session.email} className="bg-white/5" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Session token</Label>
            <Input
              readOnly
              value={session.token}
              className="bg-white/5 font-mono text-xs"
            />
          </div>
        </div>
        <div className="mt-5">
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </section>

      <section className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Linked groups
          </h2>
          <span className="text-xs text-muted-foreground">
            {session.groups.length} total
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {session.groups.map((g) => {
            const isActive = g.token === activeGroup?.token;
            return (
              <div
                key={g.token}
                className={`flex flex-col gap-2 rounded-xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                  isActive
                    ? "border-primary/30 bg-primary/[0.06]"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {g.name}
                      {isActive && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="truncate font-mono text-[11px] text-muted-foreground">
                      {g.token}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copy(g.token)}
                    className="h-8 w-8"
                    aria-label="Copy token"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => switchGroup(g.token)}
                    >
                      Switch
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-white/10 p-4">
          <Label className="text-xs text-muted-foreground">
            Link a new group
          </Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="120363012345678901@g.us"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              className="font-mono"
            />
            <Button onClick={onAdd} className="shrink-0">
              <Plus className="h-4 w-4" /> Link group
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Run the dashboard command in your WhatsApp group to get its token.
          </p>
        </div>
      </section>

      {/* OWNER QRIS PANEL */}
      {session.role === "owner" && (
        <section className="glass rounded-2xl p-6 animate-fade-in-up space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Owner QRIS Configuration
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Unggah kode pembayaran QRIS Anda. Gambar QRIS ini akan ditampilkan secara real-time kepada semua Admin Grup saat mereka ingin memperpanjang/menyewa bot.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleQrisUpload}
                disabled={uploadingQris}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Upload className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-foreground">
                {uploadingQris ? "Mengunggah..." : "Klik atau seret gambar QRIS ke sini"}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">PNG atau JPG (Maks 3MB)</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center justify-center space-y-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">QRIS Aktif Saat Ini</span>
              <div className="h-44 w-44 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center relative">
                <img
                  src={qrisUrl}
                  alt="QRIS Owner"
                  className="max-h-full max-w-full object-contain animate-fade-in"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1e293b/ffffff?text=Belum+Ada+QRIS";
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ADMIN/USER RENT BOT PANEL */}
      {session.role !== "owner" && (
        <section className="glass rounded-2xl p-6 animate-fade-in-up space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Sewa Bot / Extend Subscription
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih paket berlangganan untuk memperpanjang waktu sewa bot pada grup aktif Anda.
            </p>
          </div>

          {!activeGroup ? (
            <div className="rounded-xl border border-warning/10 bg-warning/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-warning">Grup belum terpilih: </span>
                Silakan pilih/link grup WhatsApp aktif Anda terlebih dahulu menggunakan pemilih grup (grup selector) di bagian paling atas halaman.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Group Banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Grup yang akan diperpanjang: </span>
                  <span className="font-semibold text-primary">{activeGroup.name}</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{activeGroup.token}</span>
              </div>

              {/* Step 1: Package Selection */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground/80 block">1. Pilih Paket Sewa</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)]"
                            : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="text-sm font-semibold">{pkg.name.split(" / ")[0]}</div>
                        <div className="text-xs font-bold text-primary mt-1">{pkg.name.split(" / ")[1]}</div>
                        <div className="text-[10px] text-muted-foreground mt-2">Masa aktif +{pkg.days} hari</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Payment and Screenshot Upload */}
              {selectedPackage && (
                <div className="space-y-4 pt-2 border-t border-white/5 animate-fade-in-up">
                  <span className="text-xs font-semibold text-foreground/80 block">2. Scan QRIS & Unggah Bukti Transfer</span>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* QRIS Card */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center justify-center space-y-3">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">QRIS Owner Resmi</span>
                      <div className="h-48 w-48 rounded-lg bg-white border border-white/10 overflow-hidden flex items-center justify-center shadow-lg relative p-2">
                        <img
                          src={qrisUrl}
                          alt="QRIS Pembayaran"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1e293b/ffffff?text=Hubungi+Owner";
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center">Silakan scan dan bayar tepat sesuai harga paket!</span>
                    </div>

                    {/* Screenshot Upload Card */}
                    <div className="space-y-3 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Unggah Screenshot Bukti Transfer</span>
                      
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-5 bg-white/[0.01] hover:bg-white/[0.02] transition-all relative h-36 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {proofBase64 ? (
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <CheckCircle2 className="h-8 w-8 text-success animate-bounce" />
                            <span className="text-xs font-medium text-success">Bukti transfer terunggah!</span>
                            <span className="text-[9px] text-muted-foreground">Klik untuk mengganti gambar</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="h-7 w-7 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-medium text-foreground">Klik untuk upload bukti TF</span>
                            <span className="text-[9px] text-muted-foreground mt-0.5">PNG / JPG bukti transfer sukses</span>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={handleSubmitReport}
                        disabled={submittingReport || !proofBase64}
                        className="w-full gap-2 bg-primary text-primary-foreground h-11"
                      >
                        {submittingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengirim Laporan...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Kirim Laporan Sewa
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="glass rounded-2xl border border-destructive/20 p-6 animate-fade-in-up">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive/80">
          Danger zone
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Removing the session unlinks this device only. Your bot data is safe.
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          className="mt-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Reset local session
        </Button>
      </section>
    </div>
  );
}
