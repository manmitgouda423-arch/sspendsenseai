import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  CalendarClock,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAccounts, useGoals, useProfile, useTransactions } from "@/lib/data";
import { formatMoney, monthRange, shortDate, titleize } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SpendSense AI" },
      {
        name: "description",
        content:
          "See balance, monthly income, expenses, savings progress and spending breakdown at a glance.",
      },
      { property: "og:title", content: "Dashboard — SpendSense AI" },
      {
        property: "og:description",
        content: "Your live personal finance command centre.",
      },
    ],
  }),
  component: Dashboard,
});

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  tone?: "primary" | "success" | "destructive" | "accent";
  hint?: string;
  delay?: number;
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    destructive: "text-destructive",
    accent: "text-accent",
  }[tone];
  return (
    <div
      className="glass glass-hover animate-rise rounded-2xl p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground min-w-0 truncate text-xs font-medium">{label}</p>
        <Icon className={`h-4 w-4 shrink-0 ${toneClass}`} />
      </div>
      <p className="mt-3 truncate text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="glass animate-rise rounded-2xl p-4 sm:p-5">
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: transactions, isLoading } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: goals = [] } = useGoals();
  const currency = profile?.currency ?? "INR";

  const stats = useMemo(() => {
    const txs = transactions ?? [];
    const { start, end } = monthRange();
    const inMonth = txs.filter((t) => t.occurred_on >= start && t.occurred_on <= end);
    const income = inMonth
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = inMonth
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    const balance = txs.reduce(
      (s, t) => s + (t.kind === "income" ? Number(t.amount) : -Number(t.amount)),
      0,
    );

    const byCategory = new Map<string, number>();
    inMonth
      .filter((t) => t.kind === "expense")
      .forEach((t) =>
        byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Number(t.amount)),
      );
    const breakdown = [...byCategory.entries()]
      .map(([category, amount]) => ({ category: titleize(category), amount }))
      .sort((a, b) => b.amount - a.amount);

    const days = new Map<string, { day: string; income: number; expense: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.set(key, { day: shortDate(key), income: 0, expense: 0 });
    }
    txs.forEach((t) => {
      const row = days.get(t.occurred_on);
      if (!row) return;
      if (t.kind === "income") row.income += Number(t.amount);
      else row.expense += Number(t.amount);
    });

    const upcoming = txs.filter((t) => t.is_recurring && t.kind === "expense").slice(0, 4);

    return {
      income,
      expense,
      balance,
      savings: Math.max(income - expense, 0),
      breakdown,
      timeline: [...days.values()],
      recent: txs.slice(0, 6),
      upcoming,
    };
  }, [transactions]);

  const budget = Number(profile?.monthly_budget ?? 0);
  const budgetUsed = budget > 0 ? Math.min((stats.expense / budget) * 100, 100) : 0;
  const investment = accounts
    .filter((a) => a.type === "savings" || a.type === "current")
    .reduce((s, a) => s + Number(a.balance), 0);

  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={
        profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}` : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current balance"
          value={formatMoney(stats.balance, currency)}
          icon={Wallet}
          delay={0}
        />
        <StatCard
          label="Monthly income"
          value={formatMoney(stats.income, currency)}
          icon={TrendingUp}
          tone="success"
          delay={60}
        />
        <StatCard
          label="Monthly expense"
          value={formatMoney(stats.expense, currency)}
          icon={TrendingDown}
          tone="destructive"
          delay={120}
        />
        <StatCard
          label="Saved this month"
          value={formatMoney(stats.savings, currency)}
          icon={PiggyBank}
          tone="accent"
          delay={180}
        />
        <StatCard
          label="Account balances"
          value={formatMoney(investment, currency)}
          icon={Wallet}
          hint={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
          delay={240}
        />
        <StatCard
          label="Active goals"
          value={String(goals.length)}
          icon={Target}
          tone="accent"
          hint={goals[0]?.title}
          delay={300}
        />
        <StatCard
          label="Upcoming bills"
          value={String(stats.upcoming.length)}
          icon={CalendarClock}
          hint={stats.upcoming[0] ? titleize(stats.upcoming[0].category) : "Nothing due"}
          delay={360}
        />
        <div className="glass glass-hover animate-rise rounded-2xl p-4 sm:p-5" style={{ animationDelay: "420ms" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground truncate text-xs font-medium">Budget status</p>
            <Badge variant={budgetUsed > 90 ? "destructive" : "secondary"}>
              {budget > 0 ? `${budgetUsed.toFixed(0)}%` : "Not set"}
            </Badge>
          </div>
          <Progress value={budgetUsed} className="mt-4" />
          <p className="text-muted-foreground mt-2 truncate text-xs">
            {budget > 0
              ? `${formatMoney(Math.max(budget - stats.expense, 0), currency)} left of ${formatMoney(budget, currency)}`
              : "Set a monthly budget in Settings"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Income vs expense — last 14 days">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline}>
                  <defs>
                    <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" width={44} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="var(--color-chart-3)"
                    fill="url(#inc)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="var(--color-chart-1)"
                    fill="url(#exp)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Expense breakdown">
          {stats.breakdown.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              No expenses this month yet.
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.breakdown.slice(0, 5)}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {stats.breakdown.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Recent transactions">
            {stats.recent.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Add your first transaction with the + button.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {stats.recent.map((t) => (
                  <li
                    key={t.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {t.merchant || titleize(t.category)}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {shortDate(t.occurred_on)} · {titleize(t.payment_method)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        t.kind === "income" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {t.kind === "income" ? "+" : "−"}
                      {formatMoney(Number(t.amount), currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Savings goals">
          {goals.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No goals yet — create one to start saving.
            </p>
          ) : (
            <ul className="grid gap-4">
              {goals.slice(0, 4).map((g) => {
                const pct = Math.min(
                  (Number(g.saved_amount) / Number(g.target_amount)) * 100,
                  100,
                );
                return (
                  <li key={g.id}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
                      <span className="truncate font-medium">{g.title}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Daily spending">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" width={44} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Bar dataKey="expense" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
