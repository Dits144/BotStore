import { createFileRoute } from "@tanstack/react-router";

import { PaymentSettingsPage } from "../pages/payment";

export const Route = createFileRoute("/dashboard/payment")({
  component: PaymentSettingsPage,
});
