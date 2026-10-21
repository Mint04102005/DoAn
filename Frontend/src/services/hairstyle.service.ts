import { MOCK_HAIRSTYLES } from "@/lib/mock-data";
import type { Gender, Hairstyle } from "@/types";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

/**
 * Chuyển đổi dữ liệu Hairstyle từ Backend API sang format hiển thị của Frontend
 */
export function transformBackendHairstyle(raw: any): Hairstyle {
  const isFemale = raw.gender === "Nữ" || raw.gender === "female";
  return {
    hair_id: raw.id ?? raw.hair_id,
    hair_name: raw.name ?? raw.hair_name ?? "Kiểu tóc",
    image_url: raw.imageUrl ?? raw.image_url ?? "",
    gender: isFemale ? "female" : "male",
    description: raw.description ?? "",
  };
}

export interface HairstyleDetail {
  id: number;
  name: string;
  description?: string;
  gender: string;
  hairType?: string;
  imageUrl: string;
  tags?: string[];
  faceShapes?: string[];
  createdAt?: string;
  hairFace: Array<{
    id: number;
    hairstyleId: number;
    faceShapeId: number;
    suitabilityScore: number;
    faceShape: {
      id: number;
      name: string;
    };
  }>;
}

export const hairstyleService = {
  /**
   * Gọi API công khai GET /api/hairstyles
   */
  async list(filter?: { gender?: Gender | "all" | string; search?: string }): Promise<Hairstyle[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.gender && filter.gender !== "all") {
        if (filter.gender === "female" || filter.gender === "Nữ") {
          params.append("gender", "Nữ");
        } else if (filter.gender === "male" || filter.gender === "Nam") {
          params.append("gender", "Nam");
        }
      }
      if (filter?.search) {
        params.append("search", filter.search);
      }
      params.append("limit", "50");

      const res = await fetch(`${API_BASE_URL}/hairstyles?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      return list.map(transformBackendHairstyle);
    } catch (error) {
      console.warn("Không thể tải danh sách kiểu tóc từ Backend API, dùng mock data fallback:", error);
      return filter?.gender && filter.gender !== "all"
        ? MOCK_HAIRSTYLES.filter((h) => h.gender === filter.gender)
        : MOCK_HAIRSTYLES;
    }
  },


  /**
   * Lấy chi tiết đầy đủ kiểu tóc kèm danh sách dáng mặt và điểm phù hợp: GET /api/hairstyles/:id
   */
  async getDetail(id: number): Promise<HairstyleDetail | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/hairstyles/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.warn("Không thể lấy chi tiết kiểu tóc từ Backend API:", error);
      return null;
    }
  },

  /**
   * Gọi API công khai GET /api/hairstyles/:id lấy chi tiết kiểu tóc
   */
  async getById(id: number): Promise<Hairstyle | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/hairstyles/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const raw = await res.json();
      return transformBackendHairstyle(raw);
    } catch (error) {
      console.warn("Không thể lấy chi tiết kiểu tóc từ Backend API, dùng fallback:", error);
      return MOCK_HAIRSTYLES.find((h) => h.hair_id === id) ?? null;
    }
  },

  /**
   * Gọi API công khai GET /api/hairstyles/by-face-shape/:shapeId lọc kiểu tóc theo dáng mặt
   */
  async listByFaceShape(
    shapeId: number,
    filter?: { gender?: Gender | "all" | string },
  ): Promise<{ hairstyle: Hairstyle; score: number }[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/hairstyles/by-face-shape/${shapeId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const rawList = await res.json();
      if (!Array.isArray(rawList)) return [];

      const result = rawList.map((item: any) => {
        const h = transformBackendHairstyle(item.hairstyle);
        const score = Math.round(
          typeof item.suitabilityScore === "number"
            ? item.suitabilityScore > 1
              ? item.suitabilityScore
              : item.suitabilityScore * 100
            : 80,
        );
        return {
          hairstyle: h,
          score,
        };
      });

      if (filter?.gender && filter.gender !== "all") {
        return result.filter((item) => item.hairstyle.gender === filter.gender);
      }

      return result;
    } catch (error) {
      console.warn("Không thể lọc kiểu tóc theo dáng mặt từ Backend API:", error);
      return [];
    }
  },
};

