import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AtSign, Box, KeyRound, HelpCircle, Loader2 } from "lucide-react";

import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || undefined,
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { token?: string };
  const [email, setEmail] = useState(session?.email ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated)
      navigate({
        to: "/dashboard/",
        search: { linkToken: search.token },
      });
  }, [isAuthenticated, navigate, search.token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Harap isi semua kolom.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Selamat datang kembali.");
      navigate({
        to: "/dashboard/",
        search: { linkToken: search.token },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-float)] lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between bg-secondary/65 p-12 lg:flex animate-fade-in-up">
          <div className="inline-flex w-fit items-center gap-2 text-sm font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Box className="h-4 w-4" />
            </span>
            DitsStore
          </div>
          <div>
            <h1 className="max-w-md text-[42px] font-bold leading-[1.08] tracking-[-0.04em]">
              Kelola toko bot dengan lebih tenang.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
              Satu ruang kerja untuk katalog, stok, transaksi, pembayaran, dan operasional grup
              WhatsApp.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">DitsStore Bot Store Admin</p>
        </div>

        <div className="flex flex-col justify-center p-7 animate-fade-in-up sm:p-12">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Box className="h-4 w-4" />
            </span>
            <span className="font-bold">DitsStore</span>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Masuk ke dasbor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gunakan akun admin untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <Field
              id="email"
              label="Email"
              icon={<AtSign className="h-4 w-4" />}
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Field
              id="password"
              label="Kata Sandi"
              icon={<KeyRound className="h-4 w-4" />}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <Button type="submit" disabled={loading} className="h-11 w-full text-sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Masuk…
                </>
              ) : (
                <>Masuk</>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              to="/register/"
              search={{ token: search.token }}
              className="text-primary hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  tooltip,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  tooltip?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor={id}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground/70 transition-colors hover:text-foreground"
                  aria-label={`${label} info`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="group relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 pl-10 text-sm"
        />
      </div>
    </div>
  );
}
