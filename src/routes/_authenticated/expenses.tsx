import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/transactions-page";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — FinPilot AI" },
      {
        name: "description",
        content:
          "Track food, travel, bills, EMIs and subscriptions with merchants, payment methods and tags.",
      },
      { property: "og:title", content: "Expenses — FinPilot AI" },
      { property: "og:description", content: "Know exactly where your money goes." },
    ],
  }),
  component: () => <TransactionsPage kind="expense" />,
});
