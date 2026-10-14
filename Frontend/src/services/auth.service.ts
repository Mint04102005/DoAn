import { randomDelay } from "@/lib/delay";
import { MOCK_USERS } from "@/lib/mock-data";
import type { Gender, RoleId, User } from "@/types";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterUserPayload {
  username: string;
  email: string;
  password: string;
  phone: string;
  gender: Gender;
}

export interface RegisterSalonPayload extends RegisterUserPayload {
  license_no: string;
  salonname: string;
  address: string;
}

let runtimeUsers: User[] = [...MOCK_USERS];

export const authService = {
  async login({ username, password }: LoginPayload): Promise<User> {
    await randomDelay();
    if (!password) throw new Error("Mật khẩu không được trống");
    const user = runtimeUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) throw new Error("Tài khoản không tồn tại");
    if (user.is_locked) throw new Error("Tài khoản đã bị khóa");
    return user;
  },

  async registerUser(payload: RegisterUserPayload): Promise<User> {
    await randomDelay();
    if (runtimeUsers.some((u) => u.username === payload.username))
      throw new Error("Tên đăng nhập đã tồn tại");
    const user: User = {
      user_id: Date.now(),
      username: payload.username,
      email: payload.email,
      gender: payload.gender,
      phone: payload.phone,
      role_id: 2 as RoleId,
      created_at: new Date().toISOString(),
      avatar_url: `https://i.pravatar.cc/150?u=${payload.username}`,
    };
    runtimeUsers = [...runtimeUsers, user];
    return user;
  },

  async registerSalonOwner(payload: RegisterSalonPayload): Promise<User> {
    await randomDelay();
    if (runtimeUsers.some((u) => u.username === payload.username))
      throw new Error("Tên đăng nhập đã tồn tại");
    const user: User = {
      user_id: Date.now(),
      username: payload.username,
      email: payload.email,
      gender: payload.gender,
      phone: payload.phone,
      role_id: 3 as RoleId,
      created_at: new Date().toISOString(),
      avatar_url: `https://i.pravatar.cc/150?u=${payload.username}`,
    };
    runtimeUsers = [...runtimeUsers, user];
    return user;
  },
};
