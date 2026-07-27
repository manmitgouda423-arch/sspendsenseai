import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Sparkles,
  LineChart,
  ShieldCheck,
  Target,
  ArrowRight,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/spendsense-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpendSense AI — AI Personal Finance Manager" },
      {
        name: "description",
        content:
          "Track income, expenses, accounts and savings goals with AI insights that explain your spending and predict your month-end balance.",
      },
      { property: "og:title", content: "SpendSense AI — AI Personal Finance Manager" },
      {
        property: "og:description",
        content:
          "Track income, expenses, accounts and savings goals with AI insights that explain your spending and predict your month-end balance.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: LineChart,
    title: "Live dashboard",
    body: "Balance, income, expense, savings and daily spend in animated glass cards.",
  },
  {
    icon: Sparkles,
    title: "AI money coach",
    body: "Ask anything about your money and get concrete, numeric advice.",
  },
  {
    icon: Target,
    title: "Goals that move",
    body: "Emergency fund, bike, house — track progress and monthly contribution.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your data is locked to your account with row-level security.",
  },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={logoAsset.url}
            alt="SpendSense AI logo"
            className="h-9 w-9 shrink-0 rounded-xl bg-white object-contain p-0.5"
          />
          <span className="truncate font-bold tracking-tight">SpendSense AI</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="animate-rise py-12 text-center sm:py-20">
          <span className="glass text-muted-foreground inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs">
            <Sparkles className="text-accent h-3.5 w-3.5" /> Powered by Lovable AI
          </span>
          <h1 className="mt-6 text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">
            Your money, <span className="text-gradient">on autopilot.</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base sm:text-lg">
            SpendSense AI tracks every rupee across accounts, spots wasteful spending, and
            tells you exactly how to hit your savings goals.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="glow gap-2">
              <Link to="/auth">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article key={f.title} className="glass glass-hover rounded-2xl p-5">
              <div className="bg-secondary grid h-10 w-10 place-items-center rounded-xl">
                <f.icon className="text-primary h-5 w-5" />
              </div>
              <h2 className="mt-4 text-sm font-semibold">{f.title}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">{f.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
