import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — SpendSense AI" },
      { name: "description", content: "Choose a new password for your SpendSense AI account." },
      { property: "og:title", content: "Reset password — SpendSense AI" },
      { property: "og:description", content: "Set a new password and get back to your dashboard." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter a new password for your account.
        </p>
        <div className="mt-6 grid gap-2">
          <Label htmlFor="pw">New password</Label>
          <Input
            id="pw"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy} className="mt-6 w-full">
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
