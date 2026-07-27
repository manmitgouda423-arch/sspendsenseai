import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  titleize,
  toISODate,
} from "@/lib/finance";
import { useAccounts, useUpsert, type Transaction } from "@/lib/data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultKind?: "income" | "expense";
  editing?: Transaction | null;
};

export function TransactionDialog({ open, onOpenChange, defaultKind, editing }: Props) {
  const { data: accounts = [] } = useAccounts();
  const upsert = useUpsert("transactions");

  const [kind, setKind] = useState<"income" | "expense">(defaultKind ?? "expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [merchant, setMerchant] = useState("");
  const [method, setMethod] = useState("upi");
  const [accountId, setAccountId] = useState<string>("none");
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [recurring, setRecurring] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = editing;
    setKind(source?.kind ?? defaultKind ?? "expense");
    setAmount(source ? String(source.amount) : "");
    setCategory(source?.category ?? (defaultKind === "income" ? "salary" : "food"));
    setMerchant(source?.merchant ?? "");
    setMethod(source?.payment_method ?? "upi");
    setAccountId(source?.account_id ?? "none");
    setDate(source?.occurred_on ?? toISODate(new Date()));
    setNotes(source?.notes ?? "");
    setTags(source?.tags?.join(", ") ?? "");
    setRecurring(source?.is_recurring ?? false);
  }, [open, editing, defaultKind]);

  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        kind,
        amount: value,
        category,
        merchant: merchant.trim() || null,
        payment_method: method,
        account_id: accountId === "none" ? null : accountId,
        occurred_on: date,
        notes: notes.trim() || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_recurring: recurring,
      });
      toast.success(editing ? "Transaction updated" : `${titleize(kind)} added`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
          <DialogDescription>Track every rupee in a few taps.</DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {titleize(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {titleize(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Swiggy, Shell, Employer…"
            />
          </div>
          <div className="grid gap-2">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="weekend, family"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Recurring</p>
              <p className="text-muted-foreground text-xs">Repeats every month</p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>
        </div>

        <Button onClick={submit} disabled={upsert.isPending} className="w-full">
          {upsert.isPending ? "Saving…" : editing ? "Save changes" : "Add transaction"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
