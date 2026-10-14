import { randomDelay } from "@/lib/delay";
import { MOCK_HAIRSTYLES } from "@/lib/mock-data";
import type { Gender, Hairstyle } from "@/types";

export const hairstyleService = {
  async list(filter?: { gender?: Gender }): Promise<Hairstyle[]> {
    await randomDelay(400, 900);
    return filter?.gender
      ? MOCK_HAIRSTYLES.filter((h) => h.gender === filter.gender)
      : MOCK_HAIRSTYLES;
  },
  async getById(id: number): Promise<Hairstyle | null> {
    await randomDelay(200, 500);
    return MOCK_HAIRSTYLES.find((h) => h.hair_id === id) ?? null;
  },
};
