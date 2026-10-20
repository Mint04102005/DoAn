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

  async getById(id: number): Promise<Hairstyle | null> {
    try {
      const list = await this.list();
      return list.find((h) => h.hair_id === id) ?? null;
    } catch {
      return MOCK_HAIRSTYLES.find((h) => h.hair_id === id) ?? null;
    }
  },
};

