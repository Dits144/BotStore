import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
} from "lucide-react";

import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  fetchCustomers,
  toggleGroupSetting,
  broadcastMessage,
  cloneCatalogue,
} from "../lib/api";

export const Route = createFileRoute("/dashboard/group-tools")({
  component: GroupToolsPage,
});

function GroupToolsPage() {
  const { activeGroup, session } = useAuth();
  const queryClient = useQueryClient();
  const token = activeGroup?.token ?? "";

  const [broadcastText, setBroadcastText] = useState("");
  const [sourceJid, setSourceJid] = useState("");

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ["group-customers", token],
    queryFn: () => fetchCustomers(token),
    enabled: !!token,
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

      {/* Customer Levels & Standings */}
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
    </div>
  );
}
