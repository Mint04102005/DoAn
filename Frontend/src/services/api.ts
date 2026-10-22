export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

interface ApiOptions extends RequestInit {
  public?: boolean;
  timeoutMs?: number;
}

export async function apiResponse(path: string, options: ApiOptions = {}): Promise<Response> {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Đường dẫn API không hợp lệ");
  const { public: isPublic, timeoutMs = 30000, ...init } = options;
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (!isPublic && !token) throw new ApiError("Vui lòng đăng nhập để sử dụng chức năng này", 401);
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (!isPublic && token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 && token && localStorage.getItem("accessToken") === token)
        window.dispatchEvent(new CustomEvent("auth:expired", { detail: token }));
      const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      throw new ApiError(
        message || `Không xử lý được yêu cầu (${response.status})`,
        response.status,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted)
      throw new Error(
        init.signal?.aborted
          ? "Đã hủy yêu cầu"
          : "Xử lý quá thời gian. Hãy kiểm tra lịch sử trước khi thử lại.",
      );
    throw new Error("Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.");
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", cancel);
  }
}

export async function apiJson<T>(path: string, options?: ApiOptions): Promise<T> {
  return (await apiResponse(path, options)).json();
}

export interface Page<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export async function allPages<T>(path: string, options?: ApiOptions): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  while (true) {
    const result = await apiJson<Page<T>>(
      `${path}${path.includes("?") ? "&" : "?"}limit=100&page=${page}`,
      options,
    );
    rows.push(...result.data);
    if (page >= result.pagination.totalPages) return rows;
    page++;
  }
}
