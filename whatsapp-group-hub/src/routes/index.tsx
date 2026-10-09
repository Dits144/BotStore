import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("wa-bot-dashboard:session:v1");
      if (raw) throw redirect({ to: "/dashboard/", search: { linkToken: undefined } });
    }
    throw redirect({ to: "/login/", search: { token: undefined } });
  },
  component: () => null,
});
