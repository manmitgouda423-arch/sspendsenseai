import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpsert, useUser } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SpendSense AI" },
      {
        name: "description",
        content: "Update your profile, preferred currency and monthly budget for SpendSense AI.",
      },
      { property: "og:title", content: "Settings — SpendSense AI" },
      { property: "og:description", content: "Profile, currency and budget preferences." },
    ],
  }),
  component: SettingsPage,
});

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

function SettingsPage() {
  const { data: profile } = useProfile();
  const { user } = useUser();
  const upsert = useUpsert("profiles");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setCurrency(profile.currency ?? "INR");
    setBudget(String(profile.monthly_budget ?? ""));
  }, [profile]);

  const save = async () => {
    if (!user) return;
    try {
      await upsert.mutateAsync({
        id: user.id,
        full_name: fullName.trim() || null,
        currency,
        monthly_budget: Number(budget) || 0,
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell title="Settings" subtitle={user?.email ?? undefined}>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass animate-rise rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Monthly budget</Label>
              <Input
                id="budget"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="30000"
              />
            </div>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </section>

        <section className="glass animate-rise rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Session</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Signed in as {user?.email ?? "—"}. Signing out clears cached data on this device.
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
