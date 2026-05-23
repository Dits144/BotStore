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
  X,
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
}> = [
  { to: "/dashboard", label: "Dashboard Home", icon: LayoutDashboard, end: true },
  { to: "/dashboard/price-list", label: "Price List", icon: ListOrdered },
  { to: "/dashboard/stock", label: "Stock Management", icon: Package },
  { to: "/dashboard/rentals", label: "Rentals & Groups", icon: LayoutDashboard, role: "owner" },
  { to: "/dashboard/settings", label: "Settings", icon: Cog },
];

export function DashboardLayout() {
  const { isAuthenticated, session, activeGroup, switchGroup, addGroup, logout } =
    useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/dashboard" }) as { linkToken?: string };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newToken, setNewToken] = useState(search?.linkToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (search?.linkToken && session) {
      const alreadyLinked = session.groups.some((g) => g.token === search.linkToken);
      if (alreadyLinked) {
        switchGroup(search.linkToken);
        navigate({ to: "/dashboard", search: undefined });
      } else if (session.role === "owner") {
        (async () => {
          try {
            await addGroup(search.linkToken, "");
            toast.success("Group automatically linked");
            navigate({ to: "/dashboard", search: undefined });
          } catch (e) {
            setNewToken(search.linkToken);
            setAddOpen(true);
          }
        })();
      } else {
        setNewToken(search.linkToken);
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
      toast.success("Group linked");
      setNewToken("");
      setNewPassword("");
      setAddOpen(false);
      navigate({ to: "/dashboard", search: undefined });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to link group");
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
                  Store Command
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
              Bot online
            </div>
            Active group:{" "}
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
                      {activeGroup?.name ?? "No group"}
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
                  Your linked groups
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
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setAddOpen(true);
                      }}
                      className="gap-2 text-primary focus:text-primary"
                    >
                      <Plus className="h-4 w-4" /> Link another group
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="glass-strong border-white/10">
                    <DialogHeader>
                      <DialogTitle>Link a new WhatsApp group</DialogTitle>
                      <DialogDescription>
                        Paste the Group Token (JID) shown by your bot's dashboard
                        command.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">Group Token (JID)</div>
                        <Input
                          autoFocus
                          placeholder="120363012345678901@g.us"
                          value={newToken}
                          onChange={(e) => setNewToken(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">Group Password</div>
                        <Input
                          placeholder="12345"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setAddOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddGroup}>Link group</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>

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
                        {session.groups.length} group
                        {session.groups.length === 1 ? "" : "s"}
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
                      <Cog className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      toast.success("Signed out");
                      navigate({ to: "/login" });
                    }}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Log out
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
