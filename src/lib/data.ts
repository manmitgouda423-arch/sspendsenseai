import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
};

export type Transaction = {
  id: string;
  account_id: string | null;
  kind: "income" | "expense";
  amount: number;
  category: string;
  merchant: string | null;
  payment_method: string;
  notes: string | null;
  tags: string[];
  occurred_on: string;
  is_recurring: boolean;
};

export type Goal = {
  id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  monthly_budget: number;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const res = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return res.data as unknown as Profile | null;
    },
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () =>
      unwrap<Account[]>(
        (await supabase
          .from("accounts")
          .select("*")
          .order("created_at", { ascending: true })) as never,
      ),
  });
}

export function useTransactions(limit = 500) {
  return useQuery({
    queryKey: ["transactions", limit],
    queryFn: async () =>
      unwrap<Transaction[]>(
        (await supabase
          .from("transactions")
          .select("*")
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(limit)) as never,
      ),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () =>
      unwrap<Goal[]>(
        (await supabase
          .from("savings_goals")
          .select("*")
          .order("created_at", { ascending: true })) as never,
      ),
  });
}

export function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["transactions"] });
    void qc.invalidateQueries({ queryKey: ["accounts"] });
    void qc.invalidateQueries({ queryKey: ["goals"] });
    void qc.invalidateQueries({ queryKey: ["profile"] });
  };
}

export function useUpsert<T extends Record<string, unknown>>(
  table: "accounts" | "transactions" | "savings_goals" | "profiles",
) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (values: T) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const payload =
        table === "profiles" ? values : { ...values, user_id: auth.user.id };
      const res = await supabase
        .from(table)
        .upsert(payload as never)
        .select();
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useRemove(table: "accounts" | "transactions" | "savings_goals") {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await supabase.from(table).delete().eq("id", id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: invalidate,
  });
}
