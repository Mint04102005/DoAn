import { createFileRoute } from "@tanstack/react-router";
import { UserLayout } from "@/components/layout/UserLayout";

export const Route = createFileRoute("/user")({
  component: UserLayout,
});
