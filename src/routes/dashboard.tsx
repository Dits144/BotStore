import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "../components/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      linkToken: (search.linkToken as string) || undefined,
    };
  },
  component: DashboardLayout,
});
