import { allPages, apiJson } from "./api";
import { transformBackendUser } from "./auth.service";
import { transformBackendSalon } from "./salon.service";
import type {
  ApprovalFilters,
  BackendSalonItem,
  DashboardSummary,
  EnrichedApproval,
  EnrichedUser,
  UserFilters,
} from "@/types";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  isLocked: boolean;
  createdAt: string;
  salons?: AdminSalon[];
}
interface AdminSalon extends BackendSalonItem {
  id: number;
  ownerId: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  owner: AdminUser;
}
const statusMap = { PENDING: "P", APPROVED: "A", REJECTED: "R" } as const;

function approval(raw: AdminSalon): EnrichedApproval {
  return {
    approval_id: raw.id,
    owner_id: raw.ownerId,
    status: statusMap[raw.status],
    user: transformBackendUser(raw.owner),
    salon: transformBackendSalon(raw),
    owner: {
      owner_id: raw.ownerId,
      user_id: raw.ownerId,
      license_no: "",
      is_verified: raw.status === "APPROVED",
    },
    applied_at: raw.createdAt,
  };
}

function enrichedUser(raw: AdminUser): EnrichedUser {
  const salon = raw.salons?.[0];
  return {
    ...transformBackendUser(raw),
    is_locked: raw.isLocked,
    ...(salon
      ? {
          salon: transformBackendSalon(salon),
          owner: {
            owner_id: raw.id,
            user_id: raw.id,
            license_no: "",
            is_verified: salon.status === "APPROVED",
          },
        }
      : {}),
  };
}

export const adminService = {
  async getPendingApprovals(filters?: ApprovalFilters): Promise<EnrichedApproval[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    const status = { P: "PENDING", A: "APPROVED", R: "REJECTED" } as const;
    if (filters?.status && filters.status !== "ALL") params.set("status", status[filters.status]);
    return (await allPages<AdminSalon>(`/admin/salons?${params}`)).map(approval);
  },
  async getApprovalById(id: number): Promise<EnrichedApproval> {
    return approval(await apiJson<AdminSalon>(`/admin/salons/${id}`));
  },
  async approveSalon(id: number, _adminId?: number): Promise<EnrichedApproval> {
    await apiJson(`/admin/salons/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status: "APPROVED" }),
    });
    return this.getApprovalById(id);
  },
  async rejectSalon(id: number, _adminId?: number): Promise<EnrichedApproval> {
    await apiJson(`/admin/salons/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status: "REJECTED" }),
    });
    return this.getApprovalById(id);
  },
  async getUsers(filters?: UserFilters): Promise<EnrichedUser[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
    if (filters?.role_id && filters.role_id !== "ALL")
      params.set("role", { 1: "ADMIN", 2: "USER", 3: "SALON_OWNER" }[filters.role_id]);
    return (await allPages<AdminUser>(`/admin/users?${params}`)).map(enrichedUser);
  },
  async getUserById(id: number): Promise<EnrichedUser> {
    return enrichedUser(await apiJson<AdminUser>(`/admin/users/${id}`));
  },
  async lockUser(id: number, _adminId?: number) {
    return enrichedUser(
      await apiJson<AdminUser>(`/admin/users/${id}/lock`, {
        method: "PATCH",
        body: JSON.stringify({ isLocked: true }),
      }),
    );
  },
  async unlockUser(id: number, _adminId?: number) {
    return enrichedUser(
      await apiJson<AdminUser>(`/admin/users/${id}/lock`, {
        method: "PATCH",
        body: JSON.stringify({ isLocked: false }),
      }),
    );
  },
  getDashboardSummary: () => apiJson<DashboardSummary>("/admin/dashboard"),
};
