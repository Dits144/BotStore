import { Link, Outlet, useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Box,
  ChevronsUpDown,
  CircleDollarSign,
  Cog,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Radio,
  Receipt,
  ShieldCheck,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme-context";
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
} from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const SIDEBAR_KEY = "ditsstore:sidebar-collapsed:v1";

const navGroups = [
  {
    label: "Ringkasan",
    items: [
      {
        hash: "",
        legacyPath: "/dashboard",
        label: "Beranda Dasbor",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      {
        hash: "price-list",
        legacyPath: "/dashboard/price-list",
        label: "Daftar Harga",
        icon: ListOrdered,
      },
      { hash: "stock", legacyPath: "/dashboard/stock", label: "Kelola Stok", icon: Package },
      {
        hash: "transactions",
        legacyPath: "/dashboard/transactions",
        label: "Transaksi",
        icon: Receipt,
      },
      {
        hash: "payment",
        legacyPath: "/dashboard/payment",
        label: "Pembayaran",
        icon: CreditCard,
      },
      {
        hash: "group-tools",
        legacyPath: "/dashboard/group-tools",
        label: "Alat Grup",
        icon: UsersRound,
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        hash: "rentals",
        legacyPath: "/dashboard/rentals",
        label: "Sewa & Pemilik",
        icon: CircleDollarSign,
        role: "owner",
      },
      {
        hash: "settings",
        legacyPath: "/dashboard/settings",
        label: "Pengaturan",
        icon: Cog,
      },
    ],
  },
] as const;

const pageMeta = [
  {
    hash: "price-list",
    legacyPath: "/dashboard/price-list",
    title: "Daftar Harga",
    section: "Operasional",
  },
  { hash: "stock", legacyPath: "/dashboard/stock", title: "Kelola Stok", section: "Operasional" },
  {
    hash: "transactions",
    legacyPath: "/dashboard/transactions",
    title: "Transaksi",
    section: "Operasional",
  },
  {
    hash: "payment",
    legacyPath: "/dashboard/payment",
    title: "Pembayaran",
    section: "Operasional",
  },
  {
    hash: "group-tools",
    legacyPath: "/dashboard/group-tools",
    title: "Alat Grup",
    section: "Operasional",
  },
  { hash: "rentals", legacyPath: "/dashboard/rentals", title: "Sewa & Pemilik", section: "Sistem" },
  { hash: "settings", legacyPath: "/dashboard/settings", title: "Pengaturan", section: "Sistem" },
  { hash: "", legacyPath: "/dashboard", title: "Ringkasan", section: "Dasbor" },
];

export function DashboardLayout() {
  const { isAuthenticated, session, activeGroup, switchGroup, addGroup, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ from: "/dashboard" }) as { linkToken?: string };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newToken, setNewToken] = useState(search?.linkToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const activeHash = location.hash.replace(/^#/, "");
  const currentPage = useMemo(() => {
    const isDashboardIndex =
      location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    return (
      pageMeta.find((item) =>
        isDashboardIndex ? item.hash === activeHash : item.legacyPath === location.pathname,
      ) ?? pageMeta[pageMeta.length - 1]
    );
  }, [activeHash, location.pathname]);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    setCollapsed(saved === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    const linkToken = search?.linkToken;
    if (!linkToken || !session) return;

    const alreadyLinked = session.groups.some((group) => group.token === linkToken);
    if (alreadyLinked) {
      switchGroup(linkToken);
      navigate({ to: "/dashboard/", search: { linkToken: undefined } });
      return;
    }

    if (session.role === "owner") {
      void (async () => {
        try {
          await addGroup(linkToken, "");
          toast.success("Grup otomatis dihubungkan");
          navigate({ to: "/dashboard/", search: { linkToken: undefined } });
        } catch {
          setNewToken(linkToken);
          setAddOpen(true);
        }
      })();
      return;
    }

    setNewToken(linkToken);
    setAddOpen(true);
  }, [search?.linkToken, session, switchGroup, addGroup, navigate]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      navigate({
        to: "/login/",
        search: { token: search.linkToken },
      });
    }
  }, [hydrated, isAuthenticated, navigate, search.linkToken]);

  useEffect(() => setMobileOpen(false), [location.pathname, location.hash]);

  if (!hydrated || !isAuthenticated || !session) return null;

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }

  async function handleAddGroup() {
    if (!newToken.trim()) return;
    try {
      await addGroup(newToken.trim(), newPassword.trim());
      toast.success("Grup berhasil dihubungkan");
      setNewToken("");
      setNewPassword("");
      setAddOpen(false);
      navigate({ to: "/dashboard/", search: { linkToken: undefined } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghubungkan grup");
    }
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-screen bg-background text-foreground">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[256px] transform flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-250 lg:translate-x-0 ${
            collapsed ? "lg:w-[76px]" : "lg:w-[256px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Navigasi utama"
        >
          <div className="flex h-20 items-center border-b border-sidebar-border px-4">
            <Link
              to="/dashboard/"
              search={{ linkToken: undefined }}
              className="flex min-w-0 items-center gap-3"
              aria-label="DitsStore"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Box className="h-5 w-5" />
              </div>
              <div
                className={`min-w-0 transition-opacity ${collapsed ? "lg:pointer-events-none lg:opacity-0" : "opacity-100"}`}
              >
                <div className="truncate text-[15px] font-bold tracking-[-0.02em]">DitsStore</div>
                <div className="truncate text-xs text-muted-foreground">Bot Store Admin</div>
              </div>
            </Link>
            <button
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup navigasi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(
                (item) => !("role" in item) || item.role === session.role,
              );
              if (!visibleItems.length) return null;
              return (
                <div key={group.label} className="mb-6 last:mb-0">
                  <div
                    className={`mb-2 px-3 text-[11px] font-semibold text-muted-foreground transition-opacity ${collapsed ? "lg:opacity-0" : "opacity-100"}`}
                  >
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isDashboardIndex =
                        location.pathname === "/dashboard" || location.pathname === "/dashboard/";
                      const active = isDashboardIndex
                        ? activeHash === item.hash
                        : location.pathname === item.legacyPath;
                      const link = (
                        <Link
                          to="/dashboard/"
                          search={{ linkToken: undefined }}
                          hash={item.hash}
                          hashScrollIntoView={false}
                          className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/75 hover:bg-secondary hover:text-sidebar-foreground"
                          }`}
                        >
                          {active && (
                            <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-primary" />
                          )}
                          <item.icon
                            className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                          />
                          <span
                            className={`truncate transition-opacity ${collapsed ? "lg:pointer-events-none lg:opacity-0" : "opacity-100"}`}
                          >
                            {item.label}
                          </span>
                        </Link>
                      );
                      return collapsed ? (
                        <Tooltip key={item.hash || "overview"}>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={12} className="hidden lg:block">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div key={item.hash || "overview"}>{link}</div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <div className={`mb-2 rounded-xl bg-secondary p-3 ${collapsed ? "lg:hidden" : ""}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                {session.groups.length} grup terhubung
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {activeGroup?.name ?? "Belum ada grup aktif"}
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="hidden h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
                  aria-label={collapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" />
                  ) : (
                    <PanelLeftClose className="h-[18px] w-[18px] shrink-0" />
                  )}
                  <span className={collapsed ? "sr-only" : "truncate"}>Ciutkan navigasi</span>
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Perluas navigasi</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        {mobileOpen && (
          <button
            className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup navigasi"
          />
        )}

        <div
          className={`transition-[padding] duration-250 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[256px]"}`}
        >
          <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
            <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka navigasi"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden min-w-0 md:block">
                <div className="text-xs text-muted-foreground">{currentPage.section}</div>
                <div className="truncate text-sm font-semibold">{currentPage.title}</div>
              </div>

              <div className="hidden h-8 w-px bg-border md:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex min-w-0 max-w-[280px] items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left shadow-sm transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-md">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {activeGroup?.name ?? "Pilih grup"}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {activeGroup ? "Ruang kerja aktif" : "Belum ada grup terhubung"}
                      </div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[min(22rem,calc(100vw-2rem))]">
                  <DropdownMenuLabel>
                    <span className="text-xs font-medium text-muted-foreground">Ruang kerja</span>
                  </DropdownMenuLabel>
                  {session.groups.map((group) => {
                    const isActive = group.token === activeGroup?.token;
                    return (
                      <DropdownMenuItem
                        key={group.token}
                        onClick={() => switchGroup(group.token)}
                        className="gap-3 py-2.5"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground/35"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{group.name}</div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground">
                            {group.token}
                          </div>
                        </div>
                        {isActive && (
                          <span className="text-xs font-medium text-primary">Aktif</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setAddOpen(true)}
                    className="gap-2 text-primary focus:text-primary"
                  >
                    <Plus className="h-4 w-4" /> Hubungkan grup baru
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleTheme}
                      className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label={
                        resolvedTheme === "dark" ? "Gunakan tema terang" : "Gunakan tema gelap"
                      }
                    >
                      {resolvedTheme === "dark" ? (
                        <Sun className="h-[18px] w-[18px]" />
                      ) : (
                        <Moon className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {resolvedTheme === "dark" ? "Tema terang" : "Tema gelap"}
                  </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-10 items-center gap-2 rounded-[10px] border border-border bg-card px-1.5 pr-2.5 shadow-sm transition-colors hover:bg-secondary">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                        {initials(session.email)}
                      </span>
                      <span className="hidden max-w-32 truncate text-sm font-medium xl:block">
                        {session.email.split("@")[0]}
                      </span>
                      <ChevronsUpDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="truncate text-sm font-semibold">{session.email}</div>
                      <div className="mt-0.5 text-xs font-normal capitalize text-muted-foreground">
                        {session.role}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/dashboard/"
                        search={{ linkToken: undefined }}
                        hash="settings"
                        hashScrollIntoView={false}
                        className="flex items-center gap-2"
                      >
                        <Cog className="h-4 w-4" /> Pengaturan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        toast.success("Berhasil keluar");
                        navigate({ to: "/login/", search: { token: undefined } });
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

          <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </main>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hubungkan grup WhatsApp</DialogTitle>
              <DialogDescription>
                Masukkan token grup dari perintah dasbor bot. Admin grup juga perlu memasukkan kata
                sandi grup.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                Token grup (JID)
                <Input
                  autoFocus
                  placeholder="120363012345678901@g.us"
                  value={newToken}
                  onChange={(event) => setNewToken(event.target.value)}
                  className="font-mono"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Kata sandi grup
                <Input
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setAddOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddGroup} disabled={!newToken.trim()}>
                Hubungkan grup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function initials(email: string) {
  return email
    .split(/[@._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
