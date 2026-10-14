import { createFileRoute } from "@tanstack/react-router";
import { UnifiedAiStudioPage } from "./user.try-on";

export const Route = createFileRoute("/user/recommendation")({
  head: () => ({
    meta: [
      {
        title: "AI Studio — Gợi ý & Thử tóc ảo",
      },
      {
        name: "description",
        content: "Phân tích khuôn mặt bằng AI, nhận diện dáng mặt và ghép thử kiểu tóc trực tiếp.",
      },
    ],
  }),
  component: RecommendationRouteWrapper,
});

function RecommendationRouteWrapper() {
  return <UnifiedAiStudioPage initialTab="recommend" />;
}
