import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Target, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoals, useProfile, useRemove, useUpsert } from "@/lib/data";
import { GOAL_PRESETS, formatMoney } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Savings goals — SpendSense AI" },
      {
        name: "description",
        content:
          "Set targets for your emergency fund, car, house or vacation and watch progress build every month.",
      },
      { property: "og:title", content: "Savings goals — SpendSense AI" },
      { property: "og:description", content: "Turn savings targets into progress bars." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const { data: profile } = useProfile();
  const upsert = useUpsert("savings_goals");
  const remove = useRemove("savings_goals");
  const currency = profile?.currency ?? "INR";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");

  const save = async () => {
    const targetValue = Number(target);
    if (!title.trim() || !Number.isFinite(targetValue) || targetValue <= 0) {
      toast.error("Add a title and a target amount");
      return;
    }
    try {
      await upsert.mutateAsync({
        title: title.trim(),
        target_amount: targetValue,
        saved_amount: Number(saved) || 0,
        deadline: deadline || null,
      });
      toast.success("Goal created");
      setOpen(false);
      setTitle("");
      setTarget("");
      setSaved("");
      setDeadline("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  };

  const contribute = async (id: string, current: number) => {
    const input = window.prompt("How much are you adding?");
    if (!input) return;
    const value = Number(input);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    await upsert.mutateAsync({ id, saved_amount: current + value });
    toast.success("Contribution added");
  };

  return (
    <AppShell title="Savings goals" subtitle="Target, deadline and progress">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant="outline"
              onClick={() => {
                setTitle(preset);
                setOpen(true);
              }}
            >
              {preset}
            </Button>
          ))}
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (goals ?? []).length === 0 ? (
        <div className="glass grid place-items-center rounded-2xl p-12 text-center">
          <Target className="text-muted-foreground h-8 w-8" />
          <p className="mt-3 text-sm font-medium">No goals yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick a preset above or create your own.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(goals ?? []).map((g) => {
            const savedAmount = Number(g.saved_amount);
            const targetAmount = Number(g.target_amount);
            const pct = Math.min((savedAmount / targetAmount) * 100, 100);
            const remaining = Math.max(targetAmount - savedAmount, 0);
            const months = g.deadline
              ? Math.max(
                  Math.ceil(
                    (new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
                  ),
                  1,
                )
              : null;
            return (
              <article key={g.id} className="glass glass-hover animate-rise rounded-2xl p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{g.title}</p>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {formatMoney(savedAmount, currency)} of{" "}
                      {formatMoney(targetAmount, currency)}
                      {g.deadline ? ` · by ${g.deadline}` : ""}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete goal"
                    onClick={() => remove.mutate(g.id)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
                <Progress value={pct} className="mt-4" />
                <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>{formatMoney(remaining, currency)} to go</span>
                  {months ? (
                    <span>{formatMoney(remaining / months, currency)} / month</span>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => contribute(g.id, savedAmount)}
                >
                  Add contribution
                </Button>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New savings goal</DialogTitle>
            <DialogDescription>What are you saving for?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="goal-title">Title</Label>
              <Input
                id="goal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Emergency Fund"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="goal-target">Target</Label>
                <Input
                  id="goal-target"
                  inputMode="decimal"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-saved">Already saved</Label>
                <Input
                  id="goal-saved"
                  inputMode="decimal"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-deadline">Deadline</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Create goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
