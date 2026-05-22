import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, LogOut, Plus, Radio, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { session, activeGroup, switchGroup, addGroup, logout } = useAuth();
  const navigate = useNavigate();
  const [newToken, setNewToken] = useState("");

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
