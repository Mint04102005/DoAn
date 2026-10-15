import type { RoleId, User } from "@/types";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

const ROLE_MAP: Record<string, RoleId> = {
  ADMIN: 1,
  USER: 2,
  SALON_OWNER: 3,
};

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: "USER" | "SALON_OWNER";
  salonName?: string;
  salonAddress?: string;
  salonPhone?: string;
}

/**
 * Hàm chuyển đổi User từ cấu trúc Backend sang chuẩn User của Frontend
 */
export function transformBackendUser(raw: any): User {
  const roleName: string = raw.role || "USER";
  const role_id: RoleId = ROLE_MAP[roleName] || 2;

  return {
    id: raw.id,
    user_id: raw.id,
    username: raw.username || raw.email?.split("@")[0] || raw.name || "User",
    fullname: raw.name || raw.fullname || raw.email?.split("@")[0],
    email: raw.email,
    phone: raw.phone || "",
    role_id,
    role: roleName,
    gender: raw.gender || undefined,
    dob: raw.dob || "",
    address: raw.address || "",
    avatar_url:
      raw.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        raw.name || raw.email || "user",
      )}`,
    created_at: raw.createdAt || new Date().toISOString(),
    salonId: raw.salonId || raw.salon?.id,
  };
}

export const authService = {
  /**
   * Đăng nhập người dùng qua Backend API
   * POST /api/auth/login
   */
  async login(credentials: LoginPayload): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Email hoặc mật khẩu không chính xác";
      throw new Error(errorMessage);
    }

    if (typeof window !== "undefined" && data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    return transformBackendUser(data.user);
  },

  /**
   * Đăng ký tài khoản (Khách hàng hoặc Chủ salon) qua Backend API
   * POST /api/auth/register
   */
  async register(payload: RegisterPayload): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Đăng ký tài khoản thất bại";
      throw new Error(errorMessage);
    }

    if (typeof window !== "undefined" && data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    return transformBackendUser(data.user);
  },

  /**
   * Lấy thông tin user hiện tại bằng Bearer token
   * GET /api/auth/me
   */
  async getMe(): Promise<User> {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      throw new Error(data.message || "Phiên đăng nhập đã hết hạn");
    }

    return transformBackendUser(data.user);
  },

  /**
   * Đăng xuất, xóa token lưu trên trình duyệt
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
  },
};
