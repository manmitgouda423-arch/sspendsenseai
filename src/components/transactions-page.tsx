import { useMemo, useState } from "react";
import { Pencil, Trash2, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { TransactionDialog } from "@/components/transaction-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useRemove, useTransactions, type Transaction } from "@/lib/data";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatMoney, shortDate, titleize } from "@/lib/finance";

export function TransactionsPage({ kind }: { kind: "income" | "expense" }) {
  const { data: transactions, isLoading } = useTransactions();
  const { data: profile } = useProfile();
  const remove = useRemove("transactions");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const currency = profile?.currency ?? "INR";
  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (transactions ?? [])
      .filter((t) => t.kind === kind)
      .filter((t) => category === "all" || t.category === category)
      .filter(
        (t) =>
          !q ||
          t.merchant?.toLowerCase().includes(q) ||
          t.category.includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
  }, [transactions, kind, category, query]);

  const total = rows.reduce((s, t) => s + Number(t.amount), 0);

  const onDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  };

  return (
    <AppShell
      title={kind === "income" ? "Income" : "Expenses"}
      subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"} · ${formatMoney(total, currency)}`}
    >
      <div className="glass mb-4 grid gap-3 rounded-2xl p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative min-w-0">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchant, notes, tags…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {titleize(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add {kind}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass grid place-items-center rounded-2xl p-12 text-center">
          <p className="text-sm font-medium">Nothing here yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add your first {kind} to see it show up on the dashboard.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((t) => (
            <li
              key={t.id}
              className="glass glass-hover animate-rise grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {t.merchant || titleize(t.category)}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {shortDate(t.occurred_on)} · {titleize(t.category)} ·{" "}
                  {titleize(t.payment_method)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.is_recurring ? <Badge variant="secondary">Recurring</Badge> : null}
                  {t.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`mr-2 text-sm font-bold ${
                    kind === "income" ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatMoney(Number(t.amount), currency)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(t);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() => onDelete(t.id)}
                >
                  <Trash2 className="text-destructive h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultKind={kind}
        editing={editing}
      />
    </AppShell>
  );
}
