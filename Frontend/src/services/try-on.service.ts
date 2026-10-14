import { randomDelay } from "@/lib/delay";
import { MOCK_TRY_ON_HISTORY } from "@/lib/mock-data";
import type { TryOnHistory } from "@/types";

let runtimeHistory: TryOnHistory[] = [...MOCK_TRY_ON_HISTORY];

interface MergePayload {
  user_id: number;
  hair_id: number;
  input_img_url: string;
  hair_img_url: string;
}

/**
 * Composite the chosen hair PNG over the user photo on a canvas.
 * Returns a data URL — no AI involved, pure image processing.
 */
async function compositeOnCanvas(payload: MergePayload): Promise<string> {
  if (typeof document === "undefined") return payload.input_img_url;

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Không tải được ảnh"));
      img.src = src;
    });

  try {
    const [base, hair] = await Promise.all([
      loadImage(payload.input_img_url),
      loadImage(payload.hair_img_url),
    ]);

    const W = 600;
    const H = Math.round((base.height / base.width) * W);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return payload.input_img_url;

    ctx.drawImage(base, 0, 0, W, H);
    // Overlay hair top-half with soft blend to simulate "try-on" preview
    ctx.globalAlpha = 0.55;
    ctx.globalCompositeOperation = "multiply";
    const hairH = Math.round(H * 0.55);
    ctx.drawImage(hair, 0, 0, W, hairH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    return canvas.toDataURL("image/png");
  } catch {
    return payload.input_img_url;
  }
}

export const tryOnService = {
  async merge(payload: MergePayload): Promise<string> {
    await randomDelay(1500, 2200);
    return compositeOnCanvas(payload);
  },

  async save(record: Omit<TryOnHistory, "history_id" | "saved_at">): Promise<TryOnHistory> {
    await randomDelay(500, 900);
    const item: TryOnHistory = {
      ...record,
      history_id: Date.now(),
      saved_at: new Date().toISOString(),
    };
    runtimeHistory = [item, ...runtimeHistory];
    return item;
  },

  async listByUser(user_id: number, limit?: number): Promise<TryOnHistory[]> {
    await randomDelay(300, 700);
    const list = runtimeHistory
      .filter((h) => h.user_id === user_id && h.saved_at)
      .sort((a, b) => +new Date(b.saved_at) - +new Date(a.saved_at));
    return typeof limit === "number" ? list.slice(0, limit) : list;
  },
};
