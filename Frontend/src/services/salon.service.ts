import { randomDelay } from "@/lib/delay";
import { MOCK_SALONS, MOCK_SALON_OWNERS, getStorageData, setStorageData } from "@/lib/mock-data";
import type { BackendSalonItem, Salon, SalonDetailData, SalonFilterParams, SalonOwner, UpdateSalonProfileInput } from "@/types";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

const STORAGE_KEY_SALONS = "ai_hairstyle_salons";
const STORAGE_KEY_OWNERS = "ai_hairstyle_owners";

/**
 * Helper lấy token xác thực từ localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/**
 * Chuyển đổi dữ liệu Salon từ Backend API sang format hiển thị tương thích của Frontend
 */
export function transformBackendSalon(raw: BackendSalonItem): Salon {
  const imageUrl =
    raw.image_url ||
    (Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : "") ||
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";
  return {
    salon_id: raw.id ?? raw.salon_id ?? 0,
    owner_id: raw.owner?.id ?? raw.ownerId ?? raw.owner_id ?? 0,
    salonname: raw.name ?? raw.salonname ?? "Salon",
    address: raw.address ?? "",
    rating: typeof raw.rating === "number" ? raw.rating : 5.0,
    tag: raw.tag ?? "",
    image_url: imageUrl,
    description: raw.description ?? raw.operatingHours ?? "",
  };
}

export const salonService = {
  /**
   * Khám phá danh sách Salon từ Backend API (BE-05.1: GET /api/salons)
   */
  async list(filters?: SalonFilterParams): Promise<Salon[]> {
    const params = new URLSearchParams();
    if (filters?.search?.trim()) {
      params.append("search", filters.search.trim());
    }
    if (filters?.address?.trim()) {
      params.append("address", filters.address.trim());
    }
    if (filters?.tag?.trim()) {
      params.append("tag", filters.tag.trim());
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/salons${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Không thể tải danh sách Salon (HTTP ${res.status})`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(transformBackendSalon);
  },

  /**
   * Tìm kiếm Salon theo từ khóa
   */
  async search(q?: string): Promise<Salon[]> {
    return this.list({ search: q });
  },

  /**
   * Lấy chi tiết Salon từ Backend API (BE-05.2: GET /api/salons/:id)
   */
  async getById(id: number): Promise<SalonDetailData | null> {
    const res = await fetch(`${API_BASE_URL}/salons/${id}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`Không thể lấy thông tin chi tiết Salon (HTTP ${res.status})`);
    }
    const raw = await res.json();
    const imageUrl =
      raw.image_url ||
      (Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : "") ||
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";

    return {
      id: raw.id,
      salon_id: raw.id,
      name: raw.name || raw.salonname || "Salon",
      salonname: raw.name || raw.salonname || "Salon",
      address: raw.address || "",
      phone: raw.phone || "",
      operatingHours: raw.operatingHours || null,
      images: Array.isArray(raw.images) ? raw.images : [],
      image_url: imageUrl,
      rating: typeof raw.rating === "number" ? raw.rating : 5.0,
      status: raw.status || "APPROVED",
      tag: raw.tag || "",
      description: raw.description || "",
      createdAt: raw.createdAt,
      owner: raw.owner
        ? {
            id: raw.owner.id,
            name: raw.owner.name,
            phone: raw.owner.phone,
            email: raw.owner.email,
            avatarUrl: raw.owner.avatarUrl,
          }
        : undefined,
    };
  },

  /**
   * BE-05.3: Lấy thông tin Salon của Chủ Salon đang đăng nhập
   * GET /api/salons/owner/me
   */
  async getOwnerSalon(): Promise<{ salon: Salon; owner: SalonOwner } | null> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập tài khoản Chủ Salon để tiếp tục");
    }

    const res = await fetch(`${API_BASE_URL}/salons/owner/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 404) {
      return null;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || `Lỗi tải thông tin Salon (${res.status})`;
      throw new Error(errorMessage);
    }

    const imageUrl =
      data.image_url ||
      (Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : "") ||
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";

    const salon: Salon = {
      salon_id: data.id ?? data.salon_id,
      owner_id: data.owner?.id ?? 0,
      salonname: data.name ?? data.salonname ?? "Salon",
      address: data.address ?? "",
      rating: typeof data.rating === "number" ? data.rating : 5.0,
      tag: data.tag ?? "",
      image_url: imageUrl,
      description: data.description ?? "",
    };

    const owner: SalonOwner = {
      owner_id: data.owner?.id ?? 0,
      user_id: data.owner?.id ?? 0,
      license_no: `BL-2026-${String(1000 + (data.id ?? 1))}`,
      is_verified: data.status === "APPROVED",
    };

    return { salon, owner };
  },

  /**
   * Tương thích với interface gọi cũ: gọi thẳng getOwnerSalon từ Backend API
   */
  async getSalonByUserId(_userId?: number): Promise<{ salon: Salon; owner: SalonOwner } | null> {
    return this.getOwnerSalon();
  },

  /**
   * BE-05.4: Cập nhật thông tin Salon và các thẻ thế mạnh dáng mặt
   * PUT /api/salons/owner/me
   */
  async updateOwnerSalon(data: UpdateSalonProfileInput): Promise<Salon> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập tài khoản Chủ Salon để thực hiện thao tác");
    }

    const tagString = Array.isArray(data.tag)
      ? data.tag.map((t) => String(t).trim()).filter(Boolean).join(", ")
      : (data.tag || "").trim();

    const payload: Record<string, any> = {
      salonname: data.salonname.trim(),
      address: data.address.trim(),
      tag: tagString,
    };

    if (data.description !== undefined) {
      payload.description = data.description.trim();
    }

    if (data.image_url !== undefined && data.image_url.trim()) {
      payload.image_url = data.image_url.trim();
    }

    const res = await fetch(`${API_BASE_URL}/salons/owner/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = Array.isArray(resData.message)
        ? resData.message.join(", ")
        : resData.message || `Cập nhật thông tin Salon thất bại (${res.status})`;
      throw new Error(errorMessage);
    }

    const imageUrl =
      resData.image_url ||
      (Array.isArray(resData.images) && resData.images.length > 0 ? resData.images[0] : "") ||
      data.image_url ||
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";

    return {
      salon_id: resData.id ?? resData.salon_id,
      owner_id: resData.owner?.id ?? 0,
      salonname: resData.name ?? resData.salonname ?? payload.salonname,
      address: resData.address ?? payload.address,
      rating: typeof resData.rating === "number" ? resData.rating : 5.0,
      tag: resData.tag ?? payload.tag,
      image_url: imageUrl,
      description: resData.description ?? payload.description ?? "",
    };
  },

  /**
   * Tương thích với interface gọi cũ: gọi thẳng updateOwnerSalon từ Backend API
   */
  async updateSalonProfile(_salonId: number, data: UpdateSalonProfileInput): Promise<Salon> {
    return this.updateOwnerSalon(data);
  },
};
