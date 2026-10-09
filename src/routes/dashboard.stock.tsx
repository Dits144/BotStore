import { createFileRoute } from "@tanstack/react-router";

import { StockPage } from "../pages/stock";

export const Route = createFileRoute("/dashboard/stock")({
  component: StockPage,
});
