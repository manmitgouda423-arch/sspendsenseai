import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Summary = {
  currency: string;
  income: number;
  expense: number;
  topCategories: { category: string; amount: number }[];
  recurringCount: number;
  goals: { title: string; target: number; saved: number }[];
};

async function callGateway(messages: { role: string; content: string }[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: "google/gemini-3.5-flash", messages }),
  });
  if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "No response.";
}

const SYSTEM = `You are SpendSense AI, a warm, sharp personal finance coach.
Be concrete and numeric. Use the user's currency. Keep answers under 200 words.
Use short markdown bullets. Never invent data that is not in the summary.`;

function describe(s: Summary) {
  const cats = s.topCategories.map((c) => `${c.category}: ${c.amount}`).join(", ");
  const goals = s.goals.map((g) => `${g.title} ${g.saved}/${g.target}`).join(", ") || "none";
  return `Currency: ${s.currency}
This month income: ${s.income}
This month expense: ${s.expense}
Top expense categories: ${cats || "none"}
Recurring transactions: ${s.recurringCount}
Savings goals: ${goals}`;
}

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { summary: Summary }) => input)
  .handler(async ({ data }) => {
    const content = await callGateway([
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `${describe(data.summary)}

Give 4 punchy insights about my spending, one financial health score out of 100 with a one-line reason, and a predicted end-of-month balance. Format as markdown.`,
      },
    ]);
    return { content };
  });

export const askFinanceQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { summary: Summary; question: string }) => input)
  .handler(async ({ data }) => {
    const content = await callGateway([
      { role: "system", content: SYSTEM },
      { role: "user", content: `${describe(data.summary)}\n\nQuestion: ${data.question}` },
    ]);
    return { content };
  });
