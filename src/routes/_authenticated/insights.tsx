import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { askFinanceQuestion, generateInsights } from "@/lib/ai.functions";
import { useGoals, useProfile, useTransactions } from "@/lib/data";
import { monthRange, titleize } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "AI insights — FinPilot AI" },
      {
        name: "description",
        content:
          "Get an AI financial health score, spending analysis and personalised savings advice from your own data.",
      },
      { property: "og:title", content: "AI insights — FinPilot AI" },
      { property: "og:description", content: "Your money, explained by AI." },
    ],
  }),
  component: InsightsPage,
});

function Markdownish({ text }: { text: string }) {
  return (
    <div className="grid gap-2 text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        const clean = line.replace(/\*\*/g, "").trim();
        if (!clean) return null;
        if (clean.startsWith("#")) {
          return (
            <p key={i} className="mt-2 text-sm font-semibold">
              {clean.replace(/^#+\s*/, "")}
            </p>
          );
        }
        if (/^[-*•]/.test(clean)) {
          return (
            <p key={i} className="text-muted-foreground pl-4 -indent-3">
              • {clean.replace(/^[-*•]\s*/, "")}
            </p>
          );
        }
        return (
          <p key={i} className="text-muted-foreground">
            {clean}
          </p>
        );
      })}
    </div>
  );
}

function InsightsPage() {
  const { data: transactions = [] } = useTransactions();
  const { data: goals = [] } = useGoals();
  const { data: profile } = useProfile();
  const runInsights = useServerFn(generateInsights);
  const runQuestion = useServerFn(askFinanceQuestion);

  const [insight, setInsight] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const summary = useMemo(() => {
    const { start, end } = monthRange();
    const inMonth = transactions.filter(
      (t) => t.occurred_on >= start && t.occurred_on <= end,
    );
    const byCategory = new Map<string, number>();
    inMonth
      .filter((t) => t.kind === "expense")
      .forEach((t) =>
        byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Number(t.amount)),
      );
    return {
      currency: profile?.currency ?? "INR",
      income: inMonth
        .filter((t) => t.kind === "income")
        .reduce((s, t) => s + Number(t.amount), 0),
      expense: inMonth
        .filter((t) => t.kind === "expense")
        .reduce((s, t) => s + Number(t.amount), 0),
      topCategories: [...byCategory.entries()]
        .map(([category, amount]) => ({ category: titleize(category), amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6),
      recurringCount: transactions.filter((t) => t.is_recurring).length,
      goals: goals.map((g) => ({
        title: g.title,
        target: Number(g.target_amount),
        saved: Number(g.saved_amount),
      })),
    };
  }, [transactions, goals, profile]);

  const analyse = async () => {
    setLoadingInsight(true);
    try {
      const res = await runInsights({ data: { summary } });
      setInsight(res.content);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI request failed");
    } finally {
      setLoadingInsight(false);
    }
  };

  const ask = async (text?: string) => {
    const q = (text ?? question).trim();
    if (!q) return;
    setLoadingAnswer(true);
    setAnswer(null);
    try {
      const res = await runQuestion({ data: { summary, question: q } });
      setAnswer(res.content);
      setQuestion("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI request failed");
    } finally {
      setLoadingAnswer(false);
    }
  };

  const suggestions = [
    "Where am I wasting money?",
    "How much can I save next month?",
    "Am I on track for my goals?",
  ];

  return (
    <AppShell title="AI insights" subtitle="Powered by your own transaction history">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass animate-rise rounded-2xl p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">Monthly analysis</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Health score, habits and end-of-month prediction.
              </p>
            </div>
            <Button onClick={analyse} disabled={loadingInsight} className="gap-2">
              {loadingInsight ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analyse
            </Button>
          </div>
          <div className="mt-4">
            {loadingInsight ? (
              <div className="grid gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : insight ? (
              <Markdownish text={insight} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Run an analysis to see personalised insights about this month.
              </p>
            )}
          </div>
        </section>

        <section className="glass animate-rise rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Ask anything</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => ask(s)}>
                {s}
              </Button>
            ))}
          </div>
          <form
            className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Can I afford a ₹40,000 laptop?"
            />
            <Button type="submit" size="icon" disabled={loadingAnswer} aria-label="Ask">
              {loadingAnswer ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="mt-4">
            {loadingAnswer ? (
              <div className="grid gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : answer ? (
              <Markdownish text={answer} />
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
