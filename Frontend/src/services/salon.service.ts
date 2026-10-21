import { randomDelay } from "@/lib/delay";
import { MOCK_SALONS, MOCK_SALON_OWNERS, getStorageData, setStorageData } from "@/lib/mock-data";
import type { BackendSalonItem, Salon, SalonDetailData, SalonFilterParams, SalonOwner, UpdateSalonProfileInput } from "@/types";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

const STORAGE_KEY_SALONS = "ai_hairstyle_salons";
const STORAGE_KEY_OWNERS = "ai_hairstyle_owners";

function getStoredSalons(): Salon[] {
  return getStorageData<Salon[]>(STORAGE_KEY_SALONS, MOCK_SALONS);
}

function saveStoredSalons(salons: Salon[]): void {
  setStorageData(STORAGE_KEY_SALONS, salons);
}

function getStoredOwners(): SalonOwner[] {
  return getStorageData<SalonOwner[]>(STORAGE_KEY_OWNERS, MOCK_SALON_OWNERS);
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
   * Find salon & owner info associated with a logged-in salon owner user (role_id = 3)
   */
  async getSalonByUserId(userId: number): Promise<{ salon: Salon; owner: SalonOwner } | null> {
    await randomDelay(300, 600);
    const owners = getStoredOwners();
    const salons = getStoredSalons();

    let owner = owners.find((o) => o.user_id === userId);
    // If owner record doesn't exist yet for this user, create or fall back to default owner 1
    if (!owner) {
      owner = {
        owner_id: userId === 101 ? 1 : Date.now(),
        user_id: userId,
        license_no: `BL-2025-${String(1000 + (userId % 900))}`,
        is_verified: true,
      };
    }

    let salon = salons.find((s) => s.owner_id === owner!.owner_id);
    if (!salon) {
      // Fallback for demo user 101 to Maison Hair Studio (salon_id = 1)
      salon = salons[0]!;
    }

    return { salon, owner };
  },

  /**
   * Get salon by owner_id
   */
  async getSalonByOwnerId(ownerId: number): Promise<Salon | null> {
    await randomDelay(200, 400);
    const salons = getStoredSalons();
    return salons.find((s) => s.owner_id === ownerId) ?? null;
  },

  /**
   * Update salon profile (M9 Screen)
   */
  async updateSalonProfile(salonId: number, data: UpdateSalonProfileInput): Promise<Salon> {
    await randomDelay(500, 900);

    const salons = getStoredSalons();
    const index = salons.findIndex((s) => s.salon_id === salonId);

    if (index === -1) {
      throw new Error("Không tìm thấy thông tin Salon");
    }

    const current = salons[index]!;
    const tagString = Array.isArray(data.tag) ? data.tag.join(",") : data.tag;

    const updated: Salon = {
      ...current,
      salonname: data.salonname.trim(),
      address: data.address.trim(),
      tag: tagString,
      description:
        data.description !== undefined ? data.description.trim() : current.description || "",
      image_url:
        data.image_url !== undefined && data.image_url.trim() !== ""
          ? data.image_url.trim()
          : current.image_url,
    };

    const nextSalons = [...salons];
    nextSalons[index] = updated;
    saveStoredSalons(nextSalons);

    return updated;
  },
};
