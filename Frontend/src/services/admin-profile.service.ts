import { apiJson } from "./api";
import { transformBackendUser } from "./auth.service";
import type { ChangeAdminPasswordInput, UpdateAdminProfileInput, User } from "@/types";

export const adminProfileService = {
  async getAdminProfile(_adminId?: number): Promise<User> {
    return transformBackendUser(await apiJson("/admin/profile"));
  },
  async updateAdminProfile(_adminId: number, data: UpdateAdminProfileInput): Promise<User> {
    const response = await apiJson<{ user: unknown }>("/admin/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: data.fullname, phone: data.phone, avatarUrl: data.avatar_url }),
    });
    return transformBackendUser(response.user);
  },
  async changeAdminPassword(
    _adminId: number,
    data: ChangeAdminPasswordInput,
  ): Promise<{ success: boolean }> {
    if (data.newPassword !== data.confirmPassword)
      throw new Error("Mật khẩu xác nhận không trùng khớp");
    await apiJson("/admin/change-password", {
      method: "PATCH",
      body: JSON.stringify({ oldPassword: data.currentPassword, newPassword: data.newPassword }),
    });
    return { success: true };
  },
};
