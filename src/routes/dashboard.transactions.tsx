import { createFileRoute } from "@tanstack/react-router";

import { TransactionsPage } from "../pages/transactions";

export const Route = createFileRoute("/dashboard/transactions")({
  component: TransactionsPage,
});
