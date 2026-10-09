import { createFileRoute } from "@tanstack/react-router";

import { RentalsPage } from "../pages/rentals";

export const Route = createFileRoute("/dashboard/rentals")({
  component: RentalsPage,
});
