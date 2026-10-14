import type { FaceShape, RoleId } from "@/types";

export const ROLE: Record<string, RoleId> = {
  ADMIN: 1,
  USER: 2,
  SALON_OWNER: 3,
};

export const ROLE_HOME: Record<RoleId, string> = {
  1: "/admin/approvals",
  2: "/user/home",
  3: "/salon/bookings",
};

export const FACE_SHAPES: FaceShape[] = ["Tròn", "Oval", "Vuông", "Trái Tim", "Dài"];

export const BOOKING_STATUS_LABEL = {
  P: "Chờ xác nhận",
  C: "Đã xác nhận",
  D: "Hoàn thành",
  X: "Đã hủy",
} as const;

export const APPROVAL_STATUS_LABEL = {
  P: "Chờ duyệt",
  A: "Đã duyệt",
  R: "Từ chối",
} as const;
