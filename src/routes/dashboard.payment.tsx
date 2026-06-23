import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { getGroupPaymentSettings, updateGroupPaymentSettings, API_BASE } from "../lib/api";
import { Loader2, Upload, CreditCard, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/payment")({
  component: PaymentSettingsPage,
});

function PaymentSettingsPage() {
  const { activeGroup } = useAuth();
  const [caption, setCaption] = useState("");
  const [hasQris, setHasQris] = useState(false);
  const [qrisUrl, setQrisUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load payment settings on active group change
  useEffect(() => {
    if (!activeGroup) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const settings = await getGroupPaymentSettings(activeGroup.token);
        setCaption(settings.caption || "");
        setHasQris(settings.hasQris);
        setQrisUrl(`${API_BASE}/groups/${activeGroup.token}/qris?t=${Date.now()}`);
        setPreviewUrl(null);
        setSelectedFile(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memuat pengaturan pembayaran");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [activeGroup]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 3MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!activeGroup) {
      toast.error("Pilih grup aktif terlebih dahulu!");
      return;
    }

    setSaving(true);
    try {
      let base64Image = undefined;
      if (previewUrl && selectedFile) {
        base64Image = previewUrl;
      }
      await updateGroupPaymentSettings(activeGroup.token, caption, base64Image);
      toast.success("Pengaturan pembayaran grup berhasil diperbarui!");
      setHasQris(true);
      setQrisUrl(`${API_BASE}/groups/${activeGroup.token}/qris?t=${Date.now()}`);
      setSelectedFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5 animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary animate-pulse" /> Pengaturan Pembayaran Grup
        </h1>
        <p className="text-xs text-muted-foreground">
          Kelola metode pembayaran dan instruksi transfer khusus untuk grup Anda.
        </p>
      </div>

      {!activeGroup ? (
        <div className="rounded-xl border border-warning/10 bg-warning/5 p-4 flex items-start gap-3 glass">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-xs text-warning leading-relaxed">
            <span className="font-semibold">Grup belum terpilih:</span> Silakan pilih atau tautkan grup aktif Anda terlebih dahulu menggunakan menu pemilih grup (grup selector) di bagian paling atas halaman.
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Active Group Banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between text-xs glass">
            <div>
              <span className="text-muted-foreground">Mengonfigurasi pembayaran untuk: </span>
              <span className="font-semibold text-primary">{activeGroup.name}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{activeGroup.token}</span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column: QRIS Configuration */}
              <div className="glass rounded-2xl p-6 border border-white/5 space-y-4 md:col-span-1">
                <div>
                  <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">QRIS Pembayaran Grup</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Unggah kode QRIS khusus grup ini. Jika belum diunggah, bot akan otomatis menggunakan QRIS default milik Owner.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative group aspect-square">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-6 w-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-medium text-foreground text-center">
                    Klik atau seret gambar QRIS
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Maks 3MB</span>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center justify-center space-y-2">
                  <span className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Pratinjau QRIS</span>
                  <div className="h-40 w-40 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={previewUrl || qrisUrl}
                      alt="QRIS Pembayaran Grup"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/200x200/1e293b/ffffff?text=Menggunakan+QRIS+Owner";
                      }}
                    />
                  </div>
                  {!hasQris && !previewUrl && (
                    <span className="text-[9px] text-warning text-center">Menggunakan QRIS Default Owner</span>
                  )}
                </div>
              </div>

              {/* Right Column: Caption Configuration */}
              <div className="glass rounded-2xl p-6 border border-white/5 space-y-4 md:col-span-2 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Caption Perintah Pembayaran</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Teks instruksi pembayaran yang akan dikirimkan bersama gambar QRIS saat ada yang mengetikkan <code className="bg-white/10 px-1 py-0.5 rounded text-primary">payment</code>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption" className="text-xs font-semibold text-foreground/80">Template Teks Pembayaran</Label>
                    <Textarea
                      id="caption"
                      placeholder="Masukkan caption pembayaran..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-[220px] bg-white/5 font-mono text-xs leading-relaxed"
                    />
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-[10px] text-muted-foreground leading-relaxed">
                      💡 <span className="font-semibold text-foreground/80">Tips:</span> Nama grup dan teks <code className="bg-white/10 px-1 py-0.5 rounded text-primary">Pembayaran untuk [Nama Grup]</code> akan otomatis ditambahkan secara otomatis pada baris paling bawah.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
