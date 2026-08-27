import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoAsset from "@/assets/spendsense-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SpendSense AI" },
      {
        name: "description",
        content:
          "Sign in or create your SpendSense AI account to track spending, budgets and savings goals.",
      },
      { property: "og:title", content: "Sign in — SpendSense AI" },
      {
        property: "og:description",
        content: "Access your AI-powered personal finance dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void withBusy(async () => {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent — check your inbox.");
        setForgot(false);
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created. You're in!");
          return;
        }
        setPending(true);
        toast.success("Account created — confirm your email to continue.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!remember) window.sessionStorage.setItem("finpilot-session-only", "1");
      toast.success("Welcome back");
    });
  };

  const google = () =>
    withBusy(async () => {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    });

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="glass animate-rise rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <img
              src={logoAsset.url}
              alt="SpendSense AI logo"
              className="h-10 w-10 rounded-xl bg-white object-contain p-0.5"
            />
            <div>
              <p className="font-bold tracking-tight">SpendSense AI</p>
              <p className="text-muted-foreground text-xs">
                {forgot ? "Reset your password" : "Your AI finance copilot"}
              </p>
            </div>
          </div>

          {!forgot && (
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "signin" | "signup")}
              className="mt-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "signup" && !forgot && (
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>
            {!forgot && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="••••••••"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </div>
              </div>
            )}

            {!forgot && mode === "signin" && (
              <div className="flex items-center justify-between gap-3">
                <label className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(Boolean(v))}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  className="text-primary text-sm hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" disabled={busy} className="glow w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {forgot
                ? "Send reset link"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>

            {forgot && (
              <button
                type="button"
                onClick={() => setForgot(false)}
                className="text-muted-foreground text-sm hover:underline"
              >
                Back to sign in
              </button>
            )}
          </form>

          {!forgot && (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs">or</span>
                <span className="bg-border h-px flex-1" />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={google}
                disabled={busy}
                type="button"
              >
                Continue with Google
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
