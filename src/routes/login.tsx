import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AtSign,
  KeyRound,
  Hash,
  HelpCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

export const Route = createFileRoute("/login")({
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
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in every field.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back.");
      navigate({ to: "/dashboard", search: search.token ? { linkToken: search.token } : undefined });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
        {/* Brand side */}
        <div className="hidden flex-col gap-6 lg:flex animate-fade-in-up">
          <div className="inline-flex w-fit items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            WhatsApp Store Bot
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            <span className="text-gradient">Bot Store</span>
            <br />
            <span className="text-foreground/90">Command Center</span>
          </h1>
          <p className="max-w-md text-muted-foreground">
            Link a WhatsApp group, manage its catalog, and toggle live stock
            updates in real-time — all from one polished cockpit.
          </p>

          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {[
              "Real-time stock & fast-delivery toggles",
              "Multi-group accounts with one click switching",
              "Built for the road — fully responsive",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Form card */}
        <div className="glass-strong rounded-3xl p-8 shadow-2xl animate-fade-in-up sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Sign in to your dashboard
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and password to access the Command Center.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <Field
              id="email"
              label="Email"
              icon={<AtSign className="h-4 w-4" />}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Field
              id="password"
              label="Password"
              icon={<KeyRound className="h-4 w-4" />}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              disabled={loading}
              className="group relative h-12 w-full overflow-hidden rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_10px_40px_-10px_oklch(0.78_0.18_155_/_0.6)] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign In</>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" search={search} className="text-primary hover:underline">
              Register here
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
        <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
          className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/60"
        />
      </div>
    </div>
  );
}
