import { randomDelay } from "@/lib/delay";
import { MOCK_USERS, getStorageData, setStorageData } from "@/lib/mock-data";
import type { ChangeAdminPasswordInput, UpdateAdminProfileInput, User } from "@/types";

const STORAGE_KEY_USERS = "ai_hairstyle_users";

function getStoredUsers(): User[] {
  return getStorageData<User[]>(STORAGE_KEY_USERS, MOCK_USERS);
}

function saveStoredUsers(users: User[]): void {
  setStorageData(STORAGE_KEY_USERS, users);
}

export const adminProfileService = {
  /**
   * Fetch admin profile details by admin ID
   */
  async getAdminProfile(adminId: number): Promise<User> {
    await randomDelay(300, 600);
    const users = getStoredUsers();
    const admin = users.find((u) => u.user_id === adminId && u.role_id === 1);
    if (!admin) {
      // Fall back to first admin if not found
      const fallback = users.find((u) => u.role_id === 1);
      if (fallback) return fallback;
      throw new Error("Không tìm thấy thông tin tài khoản Quản trị viên");
    }
    return admin;
  },

  /**
   * Update admin profile information
   */
  async updateAdminProfile(adminId: number, data: UpdateAdminProfileInput): Promise<User> {
    await randomDelay(500, 900);
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.user_id === adminId && u.role_id === 1);

    if (index === -1) {
      throw new Error("Không tìm thấy tài khoản Quản trị viên để cập nhật");
    }

    // Check unique username / email collision against other users
    const duplicate = users.find(
      (u) =>
        u.user_id !== adminId &&
        (u.username.toLowerCase() === data.username.toLowerCase() ||
          u.email.toLowerCase() === data.email.toLowerCase()),
    );

    if (duplicate) {
      if (duplicate.username.toLowerCase() === data.username.toLowerCase()) {
        throw new Error("Tên đăng nhập này đã được sử dụng bởi tài khoản khác");
      }
      throw new Error("Địa chỉ email này đã được sử dụng bởi tài khoản khác");
    }

    const current = users[index]!;
    const updated: User = {
      ...current,
      fullname: data.fullname.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || current.phone,
      avatar_url: data.avatar_url?.trim() || current.avatar_url,
    };

    const nextUsers = [...users];
    nextUsers[index] = updated;
    saveStoredUsers(nextUsers);

    return updated;
  },

  /**
   * Change admin password (mock service)
   */
  async changeAdminPassword(
    adminId: number,
    data: ChangeAdminPasswordInput,
  ): Promise<{ success: boolean }> {
    await randomDelay(600, 1000);
    const users = getStoredUsers();
    const admin = users.find((u) => u.user_id === adminId && u.role_id === 1);

    if (!admin) {
      throw new Error("Tài khoản Quản trị viên không tồn tại");
    }

    if (!data.currentPassword || data.currentPassword.trim() === "") {
      throw new Error("Vui lòng nhập mật khẩu hiện tại");
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự");
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new Error("Mật khẩu xác nhận không trùng khớp");
    }

    // Successfully simulated
    return { success: true };
  },
};
