import { Link, Outlet, useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ChevronsUpDown,
  Cog,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Package,
  Plus,
  Radio,
  Receipt,
  Shield,
  X,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const nav: Array<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  role?: string;
}> = [
  { to: "/dashboard", label: "Beranda Dasbor", icon: LayoutDashboard, end: true },
  { to: "/dashboard/price-list", label: "Daftar Harga", icon: ListOrdered },
  { to: "/dashboard/stock", label: "Kelola Stok", icon: Package },
  { to: "/dashboard/transactions", label: "Transaksi", icon: Receipt },
  { to: "/dashboard/payment", label: "Pembayaran", icon: CreditCard },
  { to: "/dashboard/group-tools", label: "Alat Grup", icon: Shield },
  { to: "/dashboard/rentals", label: "Sewa & Pemilik", icon: LayoutDashboard, role: "owner" },
  { to: "/dashboard/settings", label: "Pengaturan", icon: Cog },
];

export function DashboardLayout() {
  const { isAuthenticated, session, activeGroup, switchGroup, addGroup, logout } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ from: "/dashboard" }) as { linkToken?: string };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newToken, setNewToken] = useState(search?.linkToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const linkToken = search?.linkToken;
    if (linkToken && session) {
      const alreadyLinked = session.groups.some((g) => g.token === linkToken);
      if (alreadyLinked) {
        switchGroup(linkToken);
        navigate({ to: "/dashboard", search: undefined });
      } else if (session.role === "owner") {
        (async () => {
          try {
            await addGroup(linkToken, "");
            toast.success("Grup otomatis dihubungkan");
            navigate({ to: "/dashboard", search: undefined });
          } catch (e) {
            setNewToken(linkToken);
            setAddOpen(true);
          }
        })();
      } else {
        setNewToken(linkToken);
        setAddOpen(true);
      }
    }
  }, [search?.linkToken, session, switchGroup, addGroup, navigate]);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !isAuthenticated) navigate({ to: "/login", search: search.linkToken ? { token: search.linkToken } : undefined });
  }, [hydrated, isAuthenticated, navigate, search]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!hydrated || !isAuthenticated || !session) return null;

  async function handleAddGroup() {
    if (!newToken.trim()) return;
    try {
      await addGroup(newToken.trim(), newPassword.trim());
      toast.success("Grup berhasil dihubungkan");
      setNewToken("");
      setNewPassword("");
      setAddOpen(false);
      navigate({ to: "/dashboard", search: undefined });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghubungkan grup");
    }
  }

  return (
    <div className="min-h-screen text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="glass-strong m-3 flex h-[calc(100vh-1.5rem)] flex-col rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
                <Radio className="h-4 w-4 text-primary" />
                <span className="absolute inset-0 rounded-xl animate-pulse-glow" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Bot Store</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Komando Toko
                </div>
              </div>
            </Link>
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-8 flex-1 space-y-1">
            {nav.map(({ to, label, icon: Icon, end, role }) => {
              if (role && role !== session?.role) return null;
              const active = end
                ? location.pathname === to
                : location.pathname === to ||
                  location.pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    active
                      ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.78_0.18_155_/_0.3)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  {label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Bot aktif
            </div>
            Grup aktif:{" "}
            <span className="font-mono text-foreground/70">
              {truncate(activeGroup?.token ?? "—", 22)}
            </span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-72">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 px-3 pt-3">
          <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Group selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm transition-all hover:bg-white/[0.08]">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
                    <Radio className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {activeGroup?.name ?? "Tidak ada grup"}
                    </div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">
                      {activeGroup?.token ?? "—"}
                    </div>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-80 border-white/10 bg-popover/90 backdrop-blur-xl"
              >
                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                  Grup terhubung Anda
                </DropdownMenuLabel>
                {session.groups.map((g) => {
                  const isActive = g.token === activeGroup?.token;
                  return (
                    <DropdownMenuItem
                      key={g.token}
                      onClick={() => switchGroup(g.token)}
                      className="flex items-start gap-2"
                    >
                      <span
                        className={`mt-1 h-2 w-2 rounded-full ${
                          isActive ? "bg-primary shadow-[0_0_8px] shadow-primary" : "bg-muted"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{g.name}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {g.token}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setAddOpen(true)}
                  className="gap-2 text-primary focus:text-primary cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Hubungkan grup baru
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* DIALOG FOR LINK NEW GROUP */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogContent className="glass-strong border-white/10">
                <DialogHeader>
                  <DialogTitle>Hubungkan Grup WhatsApp Baru</DialogTitle>
                  <DialogDescription>
                    Tempelkan Token Grup (JID) yang didapat dari perintah dasbor bot Anda.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Token Grup (JID)</div>
                    <Input
                      autoFocus
                      placeholder="120363012345678901@g.us"
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Kata Sandi Grup</div>
                    <Input
                      placeholder="12345"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setAddOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddGroup}>Hubungkan grup</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="ml-auto flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 transition-all hover:bg-white/[0.08]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
                      {initials(session.email)}
                    </div>
                    <div className="hidden text-left sm:block">
                      <div className="text-xs font-medium leading-tight">
                        {session.email}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {session.groups.length} grup
                      </div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 border-white/10 bg-popover/90 backdrop-blur-xl"
                >
                  <DropdownMenuLabel className="truncate">
                    {session.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="flex items-center gap-2">
                      <Cog className="h-4 w-4" /> Pengaturan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      toast.success("Keluar berhasil");
                      navigate({ to: "/login" });
                    }}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-3 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function initials(email: string) {
  return email
    .split(/[@._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
