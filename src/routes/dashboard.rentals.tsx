import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, Search, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../lib/auth-context";
import { fetchRentals, addRentalTime, reduceRentalTime, type Rental } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
  
  // Dialog state
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [actionType, setActionType] = useState<"add" | "reduce" | null>(null);
  const [days, setDays] = useState("30");

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["rentals"],
    queryFn: fetchRentals,
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

  const invalidate = () => qc.invalidateQueries({ queryKey: ["rentals"] });

  const addMut = useMutation({
    mutationFn: ({ token, d }: { token: string; d: number }) => addRentalTime(token, d),
    onSuccess: () => {
      invalidate();
      toast.success(`Added ${days} days to rental`);
      closeDialog();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add time"),
  });

  const reduceMut = useMutation({
    mutationFn: ({ token, d }: { token: string; d: number }) => reduceRentalTime(token, d),
    onSuccess: () => {
      invalidate();
      toast.success(`Reduced ${days} days from rental`);
      closeDialog();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to reduce time"),
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
      toast.error("Please enter a valid number of days");
      return;
    }
    if (!selectedRental || !actionType) return;
    
    if (actionType === "add") {
      addMut.mutate({ token: selectedRental.group_id, d });
    } else {
      reduceMut.mutate({ token: selectedRental.group_id, d });
    }
  }

  if (session?.role !== "owner") {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rentals Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage bot active rentals and durations across all groups.
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-2 sm:p-4 animate-fade-in-up">
        <div className="flex items-center gap-3 px-2 pb-3 pt-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-white/5 pl-9"
            />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} of {rentals.length}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>Group Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Loading rentals…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No rentals match your search.
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
                    <TableCell className="py-3">
                      <div className="font-medium">{r.group_name}</div>
                      <div className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
                        {r.group_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isExpired || !r.is_active
                            ? "bg-destructive/15 text-destructive"
                            : "bg-success/15 text-success"
                        }`}
                      >
                        {isExpired ? "Expired" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">
                      {new Date(r.expired_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setSelectedRental(r); setActionType("add"); }}
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setSelectedRental(r); setActionType("reduce"); }}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedRental} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionType === "add" ? "Add Rental Time" : "Reduce Rental Time"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Group: <span className="font-medium text-foreground">{selectedRental?.group_name}</span>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Number of Days</div>
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
                Cancel
              </Button>
              <Button type="submit" disabled={addMut.isPending || reduceMut.isPending}>
                {(addMut.isPending || reduceMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
