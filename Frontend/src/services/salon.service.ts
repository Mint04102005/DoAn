import { randomDelay } from "@/lib/delay";
import { MOCK_SALONS, MOCK_SALON_OWNERS, getStorageData, setStorageData } from "@/lib/mock-data";
import type { Salon, SalonOwner, UpdateSalonProfileInput } from "@/types";

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

export const salonService = {
  /**
   * Search salons by keyword (Phase 1)
   */
  async search(q?: string): Promise<Salon[]> {
    await randomDelay(300, 700);
    const salons = getStoredSalons();
    if (!q) return salons;
    const k = q.toLowerCase();
    return salons.filter(
      (s) =>
        s.salonname.toLowerCase().includes(k) ||
        s.address.toLowerCase().includes(k) ||
        s.tag.toLowerCase().includes(k),
    );
  },

  /**
   * Get salon by ID
   */
  async getById(id: number): Promise<Salon | null> {
    await randomDelay(200, 400);
    const salons = getStoredSalons();
    return salons.find((s) => s.salon_id === id) ?? null;
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
