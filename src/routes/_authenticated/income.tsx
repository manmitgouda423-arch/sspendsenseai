import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/transactions-page";

export const Route = createFileRoute("/_authenticated/income")({
  head: () => ({
    meta: [
      { title: "Income — FinPilot AI" },
      {
        name: "description",
        content:
          "Log salary, freelance, business, rental and other income with tags, accounts and recurring schedules.",
      },
      { property: "og:title", content: "Income — FinPilot AI" },
      { property: "og:description", content: "Every rupee coming in, organised." },
    ],
  }),
  component: () => <TransactionsPage kind="income" />,
});
