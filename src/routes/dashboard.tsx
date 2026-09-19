import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "../components/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { linkToken?: string } => {
    return {
      linkToken: (search.linkToken as string) || undefined,
    };
  },
  component: DashboardLayout,
});
