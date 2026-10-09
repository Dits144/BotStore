import { createFileRoute } from "@tanstack/react-router";

import { PriceListPage } from "../pages/price-list";

export const Route = createFileRoute("/dashboard/price-list")({
  component: PriceListPage,
});
