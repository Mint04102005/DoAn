import { allPages } from "./api";
import type { AdminLog, LogFilters } from "@/types";

const labels: Record<string, string> = {
  LOCK_USER: "Khóa tài khoản",
  UNLOCK_USER: "Mở khóa tài khoản",
  APPROVE_SALON: "Phê duyệt salon",
  REJECT_SALON: "Từ chối salon",
  CREATE_HAIRSTYLE: "Thêm kiểu tóc",
  UPDATE_HAIRSTYLE: "Cập nhật kiểu tóc",
  DELETE_HAIRSTYLE: "Xóa kiểu tóc",
  ENSURE_FACE_SHAPE: "Khởi tạo dáng mặt",
};
export const adminLogService = {
  async getLogs(filters?: LogFilters): Promise<AdminLog[]> {
    const params = new URLSearchParams();
    if (filters?.admin_id && filters.admin_id !== "ALL")
      params.set("adminId", String(filters.admin_id));
    if (filters?.dateRange && filters.dateRange !== "ALL")
      params.set("dateRange", filters.dateRange);
    const rows = await allPages<{
      id: number;
      adminId: number;
      action: string;
      targetEntity: string;
      details?: string;
      createdAt: string;
    }>(`/admin/logs?${params}`);
    const data = rows.map((row) => ({
      log_id: row.id,
      admin_id: row.adminId,
      action: `${labels[row.action] ?? row.action} — ${row.targetEntity}${row.details ? `: ${row.details}` : ""}`,
      created_at: row.createdAt,
    }));
    const search = filters?.search?.trim().toLocaleLowerCase("vi");
    return search
      ? data.filter((row) =>
          [row.action, String(row.log_id), String(row.admin_id)].some((value) =>
            value.toLocaleLowerCase("vi").includes(search),
          ),
        )
      : data;
  },
};
