import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  Megaphone,
  Copy,
  Users,
  Loader2,
  Sparkles,
  Trophy,
  UserPlus,
  UserMinus,
  Shield,
  ShieldAlert,
  FileText,
} from "lucide-react";

import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import {
  fetchCustomers,
  toggleGroupSetting,
  broadcastMessage,
  cloneCatalogue,
  fetchGroupMembers,
  kickGroupMember,
  addGroupMember,
  fetchWelcomeSettings,
  updateWelcomeSettings,
} from "../lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

export const Route = createFileRoute("/dashboard/group-tools")({
  component: GroupToolsPage,
});

function GroupToolsPage() {
  const { activeGroup, session } = useAuth();
  const queryClient = useQueryClient();
  const token = activeGroup?.token ?? "";

  // Welcome settings state
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loadingWelcome, setLoadingWelcome] = useState(false);
  const [savingWelcome, setSavingWelcome] = useState(false);

  // Load welcome settings on mount or active group change
  useEffect(() => {
    if (!token) return;

    const loadWelcome = async () => {
      setLoadingWelcome(true);
      try {
        const settings = await fetchWelcomeSettings(token);
        setWelcomeEnabled(settings.welcomeEnabled);
        setWelcomeMessage(settings.welcomeMessage || "");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memuat setting welcome");
      } finally {
        setLoadingWelcome(false);
      }
    };

    loadWelcome();
  }, [token]);

  const handleSaveWelcome = async () => {
    if (!token) {
      toast.error("Pilih grup aktif terlebih dahulu!");
      return;
    }
    setSavingWelcome(true);
    try {
      await updateWelcomeSettings(token, welcomeEnabled, welcomeMessage);
      toast.success("Pengaturan Welcome berhasil disimpan!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan setting welcome");
    } finally {
      setSavingWelcome(false);
    }
  };

  const [broadcastText, setBroadcastText] = useState("");
  const [sourceJid, setSourceJid] = useState("");

  const { data: customers = [], isLoading: loadingCustomers, error: customersError } = useQuery({
    queryKey: ["group-customers", token],
    queryFn: () => fetchCustomers(token),
    enabled: !!token,
    retry: false,
  });

  const settingMutation = useMutation({
    mutationFn: (action: "open" | "close") => toggleGroupSetting(token, action),
    onSuccess: (_, action) => {
      toast.success(`Group successfully ${action === "close" ? "closed" : "opened"}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update group setting");
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: () => broadcastMessage(token, broadcastText.trim()),
    onSuccess: () => {
      toast.success("Broadcast successfully sent to group");
      setBroadcastText("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send broadcast");
    },
  });

  const cloneMutation = useMutation({
    mutationFn: () => cloneCatalogue(token, sourceJid.trim()),
    onSuccess: (data) => {
      toast.success(`Successfully cloned ${data.cloned} products!`);
      setSourceJid("");
      queryClient.invalidateQueries({ queryKey: ["products", token] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to clone catalogue");
    },
  });

  const [newMemberPhone, setNewMemberPhone] = useState("");

  const { data: members = [], isLoading: loadingMembers, error: membersError } = useQuery({
    queryKey: ["group-members", token],
    queryFn: () => fetchGroupMembers(token),
    enabled: !!token,
    retry: false,
  });

  const addMemberMutation = useMutation({
    mutationFn: () => addGroupMember(token, newMemberPhone.trim()),
    onSuccess: () => {
      toast.success("Anggota baru berhasil ditambahkan!");
      setNewMemberPhone("");
      queryClient.invalidateQueries({ queryKey: ["group-members", token] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menambahkan anggota");
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: (jid: string) => kickGroupMember(token, jid),
    onSuccess: () => {
      toast.success("Anggota berhasil dikeluarkan dari grup!");
      queryClient.invalidateQueries({ queryKey: ["group-members", token] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal mengeluarkan anggota");
    },
  });

  if (!token) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground/60" />
        <h2 className="mt-4 text-base font-semibold">No active group selected</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Please select a linked group from the dropdown selector at the top, or link a new group in Settings to use the Admin Tools.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in-up">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Group Cockpit · {activeGroup?.name}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Admin Tools
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Manage your WhatsApp group directly from this cockpit. Close/Open chat, send hidden tag-all broadcasts, clone catalogs, and monitor customer level standings.
        </p>
      </header>

      <Tabs defaultValue="group-controls" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/5 border border-white/10 p-1 h-auto rounded-xl">
          <TabsTrigger value="group-controls" className="py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold">
            <Lock className="h-4 w-4" /> Group Controls
          </TabsTrigger>
          <TabsTrigger value="welcome-message" className="py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold">
            <FileText className="h-4 w-4" /> Welcome Settings
          </TabsTrigger>
          <TabsTrigger value="group-members" className="py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold">
            <Users className="h-4 w-4" /> Members List
          </TabsTrigger>
          <TabsTrigger value="customer-leaderboard" className="py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold">
            <Trophy className="h-4 w-4" /> Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Group Controls */}
        <TabsContent value="group-controls" className="space-y-6 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Group Open/Close */}
            <section className="glass rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" /> Group Close / Open
                </h2>
                <p className="text-xs text-muted-foreground">
                  Directly close or open chat permissions in your WhatsApp group. Only admins will be able to send messages when closed, and an announcement will be sent.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 gap-2 bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25"
                  disabled={settingMutation.isPending}
                  onClick={() => settingMutation.mutate("close")}
                >
                  {settingMutation.isPending && settingMutation.variables === "close" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Group Close
                </Button>
                <Button
                  className="flex-1 gap-2 bg-success/15 text-success border border-success/20 hover:bg-success/25"
                  disabled={settingMutation.isPending}
                  onClick={() => settingMutation.mutate("open")}
                >
                  {settingMutation.isPending && settingMutation.variables === "open" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                  Group Open
                </Button>
              </div>
            </section>

            {/* Hidden Tag-all Broadcast */}
            <section className="glass rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" /> Hidden Tag-All Broadcast
                </h2>
                <p className="text-xs text-muted-foreground">
                  Send a message that tags ALL participants in the group silently (hidden mentions). Perfect for announcements!
                </p>
              </div>
              <div className="space-y-3">
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all resize-none"
                  placeholder="Type your announcement here..."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                />
                <Button
                  className="w-full gap-2"
                  disabled={broadcastMutation.isPending || !broadcastText.trim()}
                  onClick={() => broadcastMutation.mutate()}
                >
                  {broadcastMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Megaphone className="h-4 w-4" />
                  )}
                  Send Tag-All Broadcast
                </Button>
              </div>
            </section>

            {/* Catalogue Cloner */}
            <section className="glass rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Copy className="h-5 w-5 text-primary" /> Catalogue Cloner
                </h2>
                <p className="text-xs text-muted-foreground">
                  Instantly clone all products and categories from an existing group. Enter the Source Group JID (Token).
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Source Group JID</Label>
                  <Input
                    placeholder="120363012345678901@g.us"
                    value={sourceJid}
                    onChange={(e) => setSourceJid(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <Button
                  className="w-full gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                  disabled={cloneMutation.isPending || !sourceJid.trim()}
                  onClick={() => cloneMutation.mutate()}
                >
                  {cloneMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Clone Products
                </Button>
              </div>
            </section>
          </div>
        </TabsContent>

        {/* Tab 2: Welcome Settings */}
        <TabsContent value="welcome-message" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          <section className="glass rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Welcome Message Configuration
              </h2>
              <p className="text-xs text-muted-foreground">
                Kelola pesan penyambutan otomatis saat member baru bergabung ke grup WhatsApp ini.
              </p>
            </div>

            {loadingWelcome ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground ml-2">Memuat pengaturan welcome...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="welcome-toggle" className="text-sm font-medium">Aktifkan Welcome Message</Label>
                    <p className="text-xs text-muted-foreground">
                      Kirim pesan penyambutan otomatis saat ada anggota baru bergabung.
                    </p>
                  </div>
                  <Switch
                    id="welcome-toggle"
                    checked={welcomeEnabled}
                    onCheckedChange={setWelcomeEnabled}
                  />
                </div>

                {welcomeEnabled && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="welcome-template" className="text-xs font-semibold text-foreground/80">Template Pesan Welcome</Label>
                    <Textarea
                      id="welcome-template"
                      placeholder="Halo @user, selamat datang di grup {group}! Jangan lupa baca deskripsi yaa."
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="min-h-[100px] bg-white/5 font-mono text-sm leading-relaxed"
                    />
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
                      <span className="font-semibold text-foreground/80">Petunjuk Placeholders:</span>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Gunakan <code className="bg-white/10 px-1 py-0.5 rounded text-primary">@user</code> untuk menyebut/mention member baru yang bergabung (akan ter-tag biru secara otomatis).</li>
                        <li>Gunakan <code className="bg-white/10 px-1 py-0.5 rounded text-primary">{"{group}"}</code> untuk menampilkan nama grup WhatsApp secara dinamis.</li>
                        <li>Pesan visual default yang berisi petunjuk price list (`🛍️ *Ketik "list"...*`) akan otomatis ditambahkan ke baris paling bawah.</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveWelcome}
                    disabled={savingWelcome}
                    className="px-6"
                  >
                    {savingWelcome && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Tab 3: Group Members */}
        <TabsContent value="group-members" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          <section className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Group Members & Administration
                </h2>
                <p className="text-xs text-muted-foreground">
                  Kelola anggota aktif di dalam grup WhatsApp Anda. Tambahkan anggota baru atau keluarkan anggota secara langsung.
                </p>
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
                <Input
                  placeholder="Nomor WA (contoh: 628xxx)"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="font-mono text-xs w-full sm:w-56"
                />
                <Button
                  onClick={() => addMemberMutation.mutate()}
                  disabled={addMemberMutation.isPending || !newMemberPhone.trim()}
                  className="gap-2 shrink-0"
                >
                  {addMemberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add Member
                </Button>
              </div>
            </div>

            {loadingMembers ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : membersError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-sm text-destructive">
                <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-2" />
                <p className="font-semibold text-base">Gagal Memuat Daftar Anggota</p>
                <p className="text-xs text-destructive/80 mt-1.5 max-w-md mx-auto">
                  {(membersError as Error).message || "Koneksi ke bot WhatsApp terputus atau bot tidak memiliki akses admin di grup."}
                </p>
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                Tidak ada anggota yang terdaftar di grup ini.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                <table className="w-full border-collapse text-left text-sm text-foreground">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3">Phone Number</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members.map((m, idx) => (
                      <tr key={m.jid} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-mono">+{m.phone}</td>
                        <td className="px-4 py-3.5 font-medium text-primary/95">{m.name || "—"}</td>
                        <td className="px-4 py-3.5">
                          {m.isAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                              <Shield className="h-3 w-3" /> Admin Grup
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-white/5">
                              Member
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 text-xs"
                            disabled={kickMemberMutation.isPending}
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin mengeluarkan nomor +${m.phone} dari grup?`)) {
                                kickMemberMutation.mutate(m.jid);
                              }
                            }}
                          >
                            {kickMemberMutation.isPending && kickMemberMutation.variables === m.jid ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserMinus className="h-3.5 w-3.5" />
                            )}
                            Kick
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Tab 4: Leaderboard */}
        <TabsContent value="customer-leaderboard" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          <section className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Customer Levels & Standings
                </h2>
                <p className="text-xs text-muted-foreground">
                  Monitor active customer transaction counts and levels. Poin levels are accumulated using transaction statuses.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Trophy className="h-3.5 w-3.5" /> Leaderboard
              </span>
            </div>

            {loadingCustomers ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customersError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-sm text-destructive">
                <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-2" />
                <p className="font-semibold text-base">Gagal Memuat Data Customer</p>
                <p className="text-xs text-destructive/80 mt-1.5 max-w-md mx-auto">
                  {(customersError as Error).message || "Silakan coba beberapa saat lagi."}
                </p>
              </div>
            ) : customers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                No customers have registered transactions in this group yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                <table className="w-full border-collapse text-left text-sm text-foreground">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 text-center w-16">Rank</th>
                      <th className="px-4 py-3">Phone Number</th>
                      <th className="px-4 py-3 text-center">Transactions</th>
                      <th className="px-4 py-3">Level Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customers.map((c) => (
                      <tr key={c.customerJid} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5 text-center font-semibold tabular-nums">
                          {c.rank === 1 ? "🥇" : c.rank === 2 ? "🥈" : c.rank === 3 ? "🥉" : `${c.rank}.`}
                        </td>
                        <td className="px-4 py-3.5 font-mono">+{c.phone}</td>
                        <td className="px-4 py-3.5 text-center font-medium tabular-nums">{c.totalTransactions}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium border border-white/5">
                            <span>{c.emoji}</span> <span>{c.tier}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
