import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts, useProfile, useRemove, useUpsert } from "@/lib/data";
import { ACCOUNT_TYPES, formatMoney, titleize } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — SpendSense AI" },
      {
        name: "description",
        content:
          "Manage savings, current, wallet, cash, UPI and credit card accounts in one place.",
      },
      { property: "og:title", content: "Accounts — SpendSense AI" },
      { property: "og:description", content: "All your money sources, one view." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const { data: profile } = useProfile();
  const upsert = useUpsert("accounts");
  const remove = useRemove("accounts");
  const currency = profile?.currency ?? "INR";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("savings");
  const [balance, setBalance] = useState("");

  const save = async () => {
    if (!name.trim()) {
      toast.error("Give the account a name");
      return;
    }
    try {
      await upsert.mutateAsync({ name: name.trim(), type, balance: Number(balance) || 0 });
      toast.success("Account added");
      setOpen(false);
      setName("");
      setBalance("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  };

  const total = (accounts ?? []).reduce((s, a) => s + Number(a.balance), 0);

  return (
    <AppShell title="Accounts" subtitle={`Total ${formatMoney(total, currency)}`}>
      <div className="mb-4 flex justify-end">
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (accounts ?? []).length === 0 ? (
        <div className="glass grid place-items-center rounded-2xl p-12 text-center">
          <Wallet className="text-muted-foreground h-8 w-8" />
          <p className="mt-3 text-sm font-medium">No accounts yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add your bank, wallet or cash to assign transactions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(accounts ?? []).map((a) => (
            <article key={a.id} className="glass glass-hover animate-rise rounded-2xl p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.name}</p>
                  <Badge variant="secondary" className="mt-2">
                    {titleize(a.type)}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete account"
                  onClick={() => remove.mutate(a.id)}
                >
                  <Trash2 className="text-destructive h-4 w-4" />
                </Button>
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight">
                {formatMoney(Number(a.balance), currency)}
              </p>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New account</DialogTitle>
            <DialogDescription>Where does this money live?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="acc-name">Name</Label>
              <Input
                id="acc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="HDFC Savings"
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {titleize(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-balance">Opening balance</Label>
              <Input
                id="acc-balance"
                inputMode="decimal"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
              />
            </div>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Add account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
