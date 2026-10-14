import type { ApprovalStatus, RoleId, Salon, SalonOwner, User } from "./index";

export interface AdminLog {
  log_id: number;
  admin_id: number;
  action: string;
  created_at: string;
}

export interface EnrichedApproval {
  approval_id: number;
  owner_id: number;
  status: ApprovalStatus;
  owner?: SalonOwner;
  user?: User;
  salon?: Salon;
  license_image_url?: string;
  applied_at?: string;
}

export interface EnrichedUser extends User {
  owner?: SalonOwner;
  salon?: Salon;
}

export interface ApprovalFilters {
  search?: string;
  status?: ApprovalStatus | "ALL";
}

export interface UserFilters {
  search?: string;
  role_id?: RoleId | "ALL";
  status?: "active" | "locked" | "ALL";
}

export interface LogFilters {
  search?: string;
  admin_id?: number | "ALL";
  dateRange?: "today" | "7d" | "30d" | "ALL";
}

export interface DashboardSummary {
  pendingApprovalsCount: number;
  totalUsersCount: number;
  totalSalonsCount: number;
  lockedUsersCount: number;
}

export interface UpdateAdminProfileInput {
  fullname: string;
  username: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangeAdminPasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
