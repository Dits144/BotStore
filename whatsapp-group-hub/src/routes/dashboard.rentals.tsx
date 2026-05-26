import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, Search, Loader2, Trash2, Shield, UserPlus, Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import {
  fetchRentals,
  addRentalTime,
  reduceRentalTime,
  fetchOwners,
  addOwner,
  deleteOwner,
  addRental,
  deleteRental,
  fetchDiagnostics,
  type Rental,
  type BotOwner,
  type GroupDiagnostics,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export const Route = createFileRoute("/dashboard/rentals")({
  component: RentalsPage,
});

function RentalsPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  
  // Dialog state for Rental Add/Reduce Time
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [actionType, setActionType] = useState<"add" | "reduce" | null>(null);
  const [days, setDays] = useState("30");

  // State for Add Rental Group Modal
  const [addRentalOpen, setAddRentalOpen] = useState(false);
  const [newGroupId, setNewGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newDuration, setNewDuration] = useState("30");

  // State for Add Bot Owner
  const [newOwnerJid, setNewOwnerJid] = useState("");

  // Diagnostics modal state
  const [inspectRental, setInspectRental] = useState<Rental | null>(null);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<GroupDiagnostics | null>(null);

  const handleInspect = async (rental: Rental) => {
    setInspectRental(rental);
    setIsDiagnosticsLoading(true);
    setDiagnosticsData(null);
    try {
      const data = await fetchDiagnostics(rental.group_id);
      setDiagnosticsData(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memuat diagnostik");
      setInspectRental(null);
    } finally {
      setIsDiagnosticsLoading(false);
    }
  };

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["rentals"],
    queryFn: fetchRentals,
    enabled: session?.role === "owner",
  });

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: ["owners"],
    queryFn: fetchOwners,
    enabled: session?.role === "owner",
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rentals;
    return rentals.filter(
      (r) =>
        r.group_name.toLowerCase().includes(q) ||
        r.group_id.toLowerCase().includes(q)
    );
  }, [rentals, query]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["rentals"] });
  };
  
  const invalidateOwners = () => {
    qc.invalidateQueries({ queryKey: ["owners"] });
  };

  const addMut = useMutation({
    mutationFn: ({ token, d }: { token: string; d: number }) => addRentalTime(token, d),
    onSuccess: () => {
      invalidate();
      toast.success(`Masa sewa berhasil ditambah ${days} hari`);
      closeDialog();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menambahkan masa sewa"),
  });

  const reduceMut = useMutation({
    mutationFn: ({ token, d }: { token: string; d: number }) => reduceRentalTime(token, d),
    onSuccess: () => {
      invalidate();
      toast.success(`Masa sewa berhasil dikurangi ${days} hari`);
      closeDialog();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal mengurangi masa sewa"),
  });

  const addRentalMut = useMutation({
    mutationFn: () => addRental(newGroupId.trim(), newGroupName.trim(), parseInt(newDuration)),
    onSuccess: () => {
      invalidate();
      toast.success("Grup sewa baru berhasil ditambahkan!");
      setNewGroupId("");
      setNewGroupName("");
      setNewDuration("30");
      setAddRentalOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menambahkan grup sewa"),
  });

  const deleteRentalMut = useMutation({
    mutationFn: (token: string) => deleteRental(token),
    onSuccess: () => {
      invalidate();
      toast.success("Grup sewa berhasil dihapus sepenuhnya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menghapus grup sewa"),
  });

  const addOwnerMut = useMutation({
    mutationFn: () => addOwner(newOwnerJid.trim()),
    onSuccess: () => {
      invalidateOwners();
      toast.success("Bot owner baru berhasil ditambahkan!");
      setNewOwnerJid("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menambahkan owner baru"),
  });

  const deleteOwnerMut = useMutation({
    mutationFn: (jid: string) => deleteOwner(jid),
    onSuccess: () => {
      invalidateOwners();
      toast.success("Bot owner berhasil dihapus");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal menghapus owner"),
  });

  function closeDialog() {
    setSelectedRental(null);
    setActionType(null);
    setDays("30");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const d = parseInt(days);
    if (!d || d <= 0) {
      toast.error("Masukkan durasi hari yang valid");
      return;
    }
    if (!selectedRental || !actionType) return;
    
    if (actionType === "add") {
      addMut.mutate({ token: selectedRental.group_id, d });
    } else {
      reduceMut.mutate({ token: selectedRental.group_id, d });
    }
  }

  function submitAddRental(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupId.trim() || !newGroupName.trim() || !newDuration.trim()) {
      toast.error("Semua kolom wajib diisi");
      return;
    }
    addRentalMut.mutate();
  }

  function submitAddOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!newOwnerJid.trim()) {
      toast.error("WhatsApp JID/Nomor Owner wajib diisi");
      return;
    }
    addOwnerMut.mutate();
  }

  if (session?.role !== "owner") {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Anda tidak memiliki akses untuk melihat halaman ini.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rentals & Bot Control</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage active WhatsApp group rentals, add/delete groups, and configure bot owner access levels.
          </p>
        </div>
        <Button onClick={() => setAddRentalOpen(true)} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Rental Group
        </Button>
      </div>

      {/* RENTALS MANAGEMENT SECTION */}
      <section className="glass rounded-2xl p-2 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <h2 className="px-2 text-base font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Active Group Rentals
          </h2>
          <div className="relative max-w-xs flex-1 sm:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search JID or group name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-white/5 pl-9"
            />
          </div>
          <div className="px-2 text-xs text-muted-foreground self-end sm:self-auto">
            {filtered.length} of {rentals.length} groups
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>Group details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    <span className="mt-2 block text-xs">Loading rentals database…</span>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No rentals registered.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => {
                const isExpired = new Date(r.expired_at) < new Date();
                return (
                  <TableRow
                    key={r.group_id}
                    className="border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <TableCell className="py-3.5">
                      <div className="font-medium text-sm">{r.group_name}</div>
                      <div className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
                        {r.group_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          isExpired || !r.is_active
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-success/10 text-success border-success/20"
                        }`}
                      >
                        {isExpired ? "Expired" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">
                      {new Date(r.expired_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleInspect(r)}
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/15"
                          title="Cek Sewa / Diagnostics"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setSelectedRental(r); setActionType("add"); }}
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/15"
                          title="Add Rental Days"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setSelectedRental(r); setActionType("reduce"); }}
                          className="h-8 w-8 text-warning hover:text-warning hover:bg-warning/15"
                          title="Reduce Rental Days"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus grup sewa "${r.group_name}" sepenuhnya?`)) {
                              deleteRentalMut.mutate(r.group_id);
                            }
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/15"
                          title="Delete Rental"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* BOT OWNERS REGISTRY (CRUD OWNERS) */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="glass rounded-2xl p-5 md:col-span-1 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Add Bot Owner
          </h2>
          <p className="text-xs text-muted-foreground">
            Bot owners have global system access, bypass linked group password checks, and can view all rental details.
          </p>
          <form onSubmit={submitAddOwner} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">WhatsApp Owner JID / Nomor</Label>
              <Input
                placeholder="6282120196167@s.whatsapp.net"
                value={newOwnerJid}
                onChange={(e) => setNewOwnerJid(e.target.value)}
                className="font-mono text-xs"
              />
              <span className="text-[9px] text-muted-foreground block leading-tight">
                Format: [nomor]@s.whatsapp.net atau [nomor]@c.us atau [nomor]@lid.
              </span>
            </div>
            <Button type="submit" disabled={addOwnerMut.isPending} className="w-full">
              {addOwnerMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Bot Owner"}
            </Button>
          </form>
        </div>

        <div className="glass rounded-2xl p-5 md:col-span-2 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Bot Owners Registry
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-left">Owner WhatsApp JID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-left">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Action</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOwners && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoadingOwners && owners.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                      No secondary owners registered.
                    </TableCell>
                  </TableRow>
                )}
                {owners.map((o) => (
                  <TableRow key={o.jid} className="border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs">{o.jid}</td>
                    <td className="px-4 py-3 text-xs">
                      {o.is_main === 1 ? (
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20">
                          Main Owner
                        </span>
                      ) : (
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] text-muted-foreground border border-white/10">
                          Secondary
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.is_main !== 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus akses owner dari "${o.jid}"?`)) {
                              deleteOwnerMut.mutate(o.jid);
                            }
                          }}
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* DIALOG FOR RENTAL DAYS MODIFIER */}
      <Dialog open={!!selectedRental} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionType === "add" ? "Tambah Masa Sewa" : "Kurangi Masa Sewa"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Group: <span className="font-medium text-foreground">{selectedRental?.group_name}</span>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Jumlah Hari</div>
              <Input
                type="number"
                min="1"
                autoFocus
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="font-mono"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={addMut.isPending || reduceMut.isPending}>
                {(addMut.isPending || reduceMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG FOR ADD NEW RENTAL GROUP */}
      <Dialog open={addRentalOpen} onOpenChange={setAddRentalOpen}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Rental Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAddRental} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">WhatsApp Group JID (Token)</Label>
              <Input
                placeholder="120363012345678901@g.us"
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
                className="font-mono text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Group Name</Label>
              <Input
                placeholder="DitsStore Customer"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Duration (Days)</Label>
              <Input
                type="number"
                min="1"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="font-mono"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddRentalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addRentalMut.isPending}>
                {addRentalMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Rental Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG FOR CEK SEWA DIAGNOSTICS */}
      <Dialog open={!!inspectRental} onOpenChange={(o) => !o && setInspectRental(null)}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary animate-pulse" />
              <span>Cek Sewa & Group Diagnostics</span>
            </DialogTitle>
          </DialogHeader>

          {isDiagnosticsLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground animate-pulse">
                Mengambil metrik server & database...
              </span>
            </div>
          )}

          {!isDiagnosticsLoading && diagnosticsData && (
            <div className="space-y-6 pt-2">
              {/* Group Overview Card */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base">{diagnosticsData.group_name}</h3>
                    <p className="font-mono text-[10px] text-muted-foreground line-clamp-1">
                      {diagnosticsData.group_id}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                      new Date(diagnosticsData.expired_at) < new Date() || !diagnosticsData.is_active
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-success/10 text-success border-success/20"
                    }`}
                  >
                    {new Date(diagnosticsData.expired_at) < new Date() ? "Expired" : "Active"}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Masa Sewa</span>
                    <span className="font-medium text-foreground">{diagnosticsData.duration_days} Hari</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Expired At</span>
                    <span className="font-mono text-foreground">
                      {new Date(diagnosticsData.expired_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database & Catalogue Stats */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Database & Catalogue Health
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-1">
                    <span className="text-muted-foreground text-[10px] block uppercase leading-tight">Total Produk</span>
                    <span className="text-lg font-bold tracking-tight text-foreground">
                      {diagnosticsData.total_products}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-1">
                    <span className="text-muted-foreground text-[10px] block uppercase leading-tight">Total Transaksi</span>
                    <span className="text-lg font-bold tracking-tight text-foreground text-success">
                      {diagnosticsData.total_transactions}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-1">
                    <span className="text-muted-foreground text-[10px] block uppercase leading-tight">Pelanggan Unik</span>
                    <span className="text-lg font-bold tracking-tight text-foreground text-primary">
                      {diagnosticsData.total_customers}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-1">
                    <span className="text-muted-foreground text-[10px] block uppercase leading-tight">Ukuran Database</span>
                    <span className="text-lg font-mono font-bold tracking-tight text-foreground">
                      {diagnosticsData.system.database_size_kb >= 1024
                        ? `${(diagnosticsData.system.database_size_kb / 1024).toFixed(2)} MB`
                        : `${diagnosticsData.system.database_size_kb} KB`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Server Performance Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Server Performance
                </h4>

                {/* CPU Progress */}
                <div className="space-y-1 rounded-xl border border-white/5 bg-white/[0.01] p-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="text-foreground">{diagnosticsData.system.cpu_usage}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${diagnosticsData.system.cpu_usage}%` }}
                    />
                  </div>
                </div>

                {/* RAM Progress */}
                <div className="space-y-1 rounded-xl border border-white/5 bg-white/[0.01] p-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="text-foreground">
                      {diagnosticsData.system.memory_usage}% ({diagnosticsData.system.memory_used_mb}MB / {diagnosticsData.system.memory_total_mb}MB)
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-success h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${diagnosticsData.system.memory_usage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" className="w-full sm:w-auto" onClick={() => setInspectRental(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
