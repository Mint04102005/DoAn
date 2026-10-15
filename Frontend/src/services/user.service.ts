import type { User } from "@/types";
import { transformBackendUser } from "./auth.service";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  gender?: string;
  dob?: string;
  address?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const userService = {
  /**
   * Lấy thông tin tài khoản hiện tại từ Backend API
   * GET /api/users/me
   */
  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: getAuthHeader(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Không thể tải thông tin tài khoản");
    }

    return transformBackendUser(data);
  },

  /**
   * Cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar)
   * PATCH /api/users/me
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Cập nhật thông tin cá nhân thất bại";
      throw new Error(errorMessage);
    }

    return transformBackendUser(data.user);
  },

  /**
   * Đổi mật khẩu tài khoản
   * PATCH /api/users/change-password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Đổi mật khẩu thất bại";
      throw new Error(errorMessage);
    }

    return data;
  },
};
