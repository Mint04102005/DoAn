import { randomDelay } from "@/lib/delay";
import { MOCK_FACE_SHAPES, MOCK_HAIR_FACE, MOCK_HAIRSTYLES } from "@/lib/mock-data";
import type { FaceShape, Gender, RecommendationResult } from "@/types";

interface AnalyzeInput {
  imageDataUrl: string;
  description: string;
  gender: Gender;
}

const EXPLANATIONS: Record<FaceShape, string> = {
  Oval: "Khuôn mặt oval cân đối, phù hợp với hầu hết các kiểu tóc — đặc biệt là layered và lob.",
  Tròn: "Khuôn mặt tròn nên ưu tiên kiểu tóc tạo độ dài và thể tích phía đỉnh đầu để kéo dài tỉ lệ.",
  Vuông: "Khuôn mặt vuông hợp với kiểu tóc mềm mại, layer dài và mái thưa để làm dịu đường nét.",
  "Trái Tim":
    "Khuôn mặt trái tim cân đối khi cằm hẹp được nâng đỡ bằng tóc bồng hai bên hoặc lob ngang quai hàm.",
  Dài: "Khuôn mặt dài hợp với mái ngang, tóc xoăn sóng tạo cảm giác cân đối chiều rộng.",
};

export const recommendationService = {
  async analyzeFace(input: AnalyzeInput): Promise<RecommendationResult> {
    await randomDelay(2000, 2800);
    if (!input.imageDataUrl) throw new Error("Vui lòng cung cấp ảnh khuôn mặt");

    // Deterministic-ish mock from description hash
    const hash = Array.from(input.description + input.imageDataUrl.slice(-40)).reduce(
      (acc, ch) => acc + ch.charCodeAt(0),
      0,
    );
    const shape = MOCK_FACE_SHAPES[hash % MOCK_FACE_SHAPES.length]!.shape_name;
    const confidence = 82 + (hash % 16);

    const shapeId = MOCK_FACE_SHAPES.find((s) => s.shape_name === shape)!.shape_id;

    const recommendations = MOCK_HAIRSTYLES.filter((h) => h.gender === input.gender)
      .map((h) => {
        const rule = MOCK_HAIR_FACE.find((r) => r.hair_id === h.hair_id && r.shape_id === shapeId);
        return { hairstyle: h, score: rule?.suitability_score ?? 50 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      detectedShape: shape,
      confidence,
      explanation: EXPLANATIONS[shape],
      recommendations,
    };
  },
};
