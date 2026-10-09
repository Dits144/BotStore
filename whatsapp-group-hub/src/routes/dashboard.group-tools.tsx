import { createFileRoute } from "@tanstack/react-router";

import { GroupToolsPage } from "../pages/group-tools";

export const Route = createFileRoute("/dashboard/group-tools")({
  component: GroupToolsPage,
});
