import { createFileRoute } from "@tanstack/react-router";
import { SalonLayout } from "@/components/layout/SalonLayout";

export const Route = createFileRoute("/salon")({
  component: SalonLayout,
});
