import { MOCK_FACE_SHAPES } from "@/lib/mock-data";
import type { FaceShape } from "@/types";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

export interface FaceShapeItem {
  id: number;
  name: FaceShape | string;
  createdAt?: string;
}

export const faceShapeService = {
  /**
   * Gọi API công khai GET /api/face-shapes
   */
  async list(): Promise<FaceShapeItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/face-shapes`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return MOCK_FACE_SHAPES.map((s) => ({
        id: s.shape_id,
        name: s.shape_name,
      }));
    } catch (error) {
      console.warn("Không thể tải danh sách dáng mặt từ Backend API, dùng fallback:", error);
      return MOCK_FACE_SHAPES.map((s) => ({
        id: s.shape_id,
        name: s.shape_name,
      }));
    }
  },
};
