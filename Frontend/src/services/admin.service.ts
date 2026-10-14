import { randomDelay } from "@/lib/delay";
import {
  MOCK_APPROVALS,
  MOCK_LICENSE_IMAGES,
  MOCK_SALONS,
  MOCK_SALON_OWNERS,
  MOCK_USERS,
  getStorageData,
  setStorageData,
} from "@/lib/mock-data";
import { adminLogService } from "@/services/admin-log.service";
import type {
  ApprovalFilters,
  DashboardSummary,
  EnrichedApproval,
  EnrichedUser,
  PendingApproval,
  Salon,
  SalonOwner,
  User,
  UserFilters,
} from "@/types";

const STORAGE_KEY_USERS = "ai_hairstyle_users";
const STORAGE_KEY_OWNERS = "ai_hairstyle_owners";
const STORAGE_KEY_APPROVALS = "ai_hairstyle_approvals";
const STORAGE_KEY_SALONS = "ai_hairstyle_salons";

function getStoredUsers(): User[] {
  return getStorageData<User[]>(STORAGE_KEY_USERS, MOCK_USERS);
}

function saveStoredUsers(users: User[]): void {
  setStorageData(STORAGE_KEY_USERS, users);
}

function getStoredOwners(): SalonOwner[] {
  return getStorageData<SalonOwner[]>(STORAGE_KEY_OWNERS, MOCK_SALON_OWNERS);
}

function saveStoredOwners(owners: SalonOwner[]): void {
  setStorageData(STORAGE_KEY_OWNERS, owners);
}

function getStoredApprovals(): PendingApproval[] {
  return getStorageData<PendingApproval[]>(STORAGE_KEY_APPROVALS, MOCK_APPROVALS);
}

function saveStoredApprovals(approvals: PendingApproval[]): void {
  setStorageData(STORAGE_KEY_APPROVALS, approvals);
}

function getStoredSalons(): Salon[] {
  return getStorageData<Salon[]>(STORAGE_KEY_SALONS, MOCK_SALONS);
}

function enrichSingleApproval(
  approval: PendingApproval,
  owners: SalonOwner[],
  users: User[],
  salons: Salon[],
): EnrichedApproval {
  const owner = owners.find((o) => o.owner_id === approval.owner_id);
  const user = owner ? users.find((u) => u.user_id === owner.user_id) : undefined;
  const salon = salons.find((s) => s.owner_id === approval.owner_id);
  const license_image_url =
    MOCK_LICENSE_IMAGES[(approval.approval_id - 1) % MOCK_LICENSE_IMAGES.length];

  return {
    ...approval,
    owner,
    user,
    salon,
    license_image_url,
    applied_at: user?.created_at || new Date(Date.now() - 86400000 * 5).toISOString(),
  };
}

function enrichSingleUser(user: User, owners: SalonOwner[], salons: Salon[]): EnrichedUser {
  const owner = owners.find((o) => o.user_id === user.user_id);
  const salon = owner ? salons.find((s) => s.owner_id === owner.owner_id) : undefined;

  return {
    ...user,
    owner,
    salon,
  };
}

export const adminService = {
  /**
   * Fetch pending salon approvals with relational data joined
   */
  async getPendingApprovals(filters?: ApprovalFilters): Promise<EnrichedApproval[]> {
    await randomDelay(400, 800);
    const approvals = getStoredApprovals();
    const owners = getStoredOwners();
    const users = getStoredUsers();
    const salons = getStoredSalons();

    let list = approvals.map((a) => enrichSingleApproval(a, owners, users, salons));

    // Status filter
    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((item) => item.status === filters.status);
    }

    // Search filter
    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((item) => {
        const ownerIdMatch = String(item.owner_id).includes(q);
        const approvalIdMatch = String(item.approval_id).includes(q);
        const usernameMatch = item.user?.username.toLowerCase().includes(q) ?? false;
        const fullnameMatch = item.user?.fullname?.toLowerCase().includes(q) ?? false;
        const emailMatch = item.user?.email.toLowerCase().includes(q) ?? false;
        const phoneMatch = item.user?.phone.includes(q) ?? false;
        const licenseMatch = item.owner?.license_no.toLowerCase().includes(q) ?? false;
        const salonMatch = item.salon?.salonname.toLowerCase().includes(q) ?? false;

        return (
          ownerIdMatch ||
          approvalIdMatch ||
          usernameMatch ||
          fullnameMatch ||
          emailMatch ||
          phoneMatch ||
          licenseMatch ||
          salonMatch
        );
      });
    }

    return list;
  },

  /**
   * Get single approval detail with full relations
   */
  async getApprovalById(approvalId: number): Promise<EnrichedApproval | null> {
    await randomDelay(300, 600);
    const approvals = getStoredApprovals();
    const approval = approvals.find((a) => a.approval_id === approvalId);
    if (!approval) return null;

    const owners = getStoredOwners();
    const users = getStoredUsers();
    const salons = getStoredSalons();

    return enrichSingleApproval(approval, owners, users, salons);
  },

  /**
   * Approve a salon verification request (P -> A)
   * Updates PENDING_APPROVALS, SALON_OWNERS, and creates an audit log
   */
  async approveSalon(approvalId: number, adminId: number): Promise<EnrichedApproval> {
    await randomDelay(500, 900);

    const approvals = getStoredApprovals();
    const owners = getStoredOwners();
    const users = getStoredUsers();
    const salons = getStoredSalons();

    const appIndex = approvals.findIndex((a) => a.approval_id === approvalId);
    if (appIndex === -1) {
      throw new Error("Không tìm thấy yêu cầu phê duyệt");
    }

    const currentApproval = approvals[appIndex]!;
    if (currentApproval.status !== "P") {
      throw new Error("Chỉ có thể phê duyệt yêu cầu đang ở trạng thái 'Chờ duyệt'");
    }

    // Transaction-like clone
    const nextApprovals = [...approvals];
    nextApprovals[appIndex] = {
      ...currentApproval,
      status: "A",
    };

    const nextOwners = [...owners];
    const ownerIndex = nextOwners.findIndex((o) => o.owner_id === currentApproval.owner_id);
    if (ownerIndex !== -1) {
      nextOwners[ownerIndex] = {
        ...nextOwners[ownerIndex]!,
        is_verified: true,
      };
    }

    // Commit changes
    saveStoredApprovals(nextApprovals);
    saveStoredOwners(nextOwners);

    const targetOwner = nextOwners[ownerIndex];
    const targetUser = targetOwner ? users.find((u) => u.user_id === targetOwner.user_id) : null;
    const targetSalon = salons.find((s) => s.owner_id === currentApproval.owner_id);

    // Create system audit log
    await adminLogService.createLog({
      admin_id: adminId,
      action: `Phê duyệt Salon đối tác #${currentApproval.owner_id} (${targetSalon?.salonname || targetUser?.fullname || "Salon"}) - Giấy phép ${targetOwner?.license_no || "N/A"}`,
    });

    return enrichSingleApproval(nextApprovals[appIndex]!, nextOwners, users, salons);
  },

  /**
   * Reject a salon verification request (P -> R)
   * Updates PENDING_APPROVALS, SALON_OWNERS, and creates an audit log
   */
  async rejectSalon(approvalId: number, adminId: number): Promise<EnrichedApproval> {
    await randomDelay(500, 900);

    const approvals = getStoredApprovals();
    const owners = getStoredOwners();
    const users = getStoredUsers();
    const salons = getStoredSalons();

    const appIndex = approvals.findIndex((a) => a.approval_id === approvalId);
    if (appIndex === -1) {
      throw new Error("Không tìm thấy yêu cầu phê duyệt");
    }

    const currentApproval = approvals[appIndex]!;
    if (currentApproval.status !== "P") {
      throw new Error("Chỉ có thể từ chối yêu cầu đang ở trạng thái 'Chờ duyệt'");
    }

    // Transaction-like clone
    const nextApprovals = [...approvals];
    nextApprovals[appIndex] = {
      ...currentApproval,
      status: "R",
    };

    const nextOwners = [...owners];
    const ownerIndex = nextOwners.findIndex((o) => o.owner_id === currentApproval.owner_id);
    if (ownerIndex !== -1) {
      nextOwners[ownerIndex] = {
        ...nextOwners[ownerIndex]!,
        is_verified: false,
      };
    }

    // Commit changes
    saveStoredApprovals(nextApprovals);
    saveStoredOwners(nextOwners);

    const targetOwner = nextOwners[ownerIndex];
    const targetUser = targetOwner ? users.find((u) => u.user_id === targetOwner.user_id) : null;
    const targetSalon = salons.find((s) => s.owner_id === currentApproval.owner_id);

    // Create system audit log
    await adminLogService.createLog({
      admin_id: adminId,
      action: `Từ chối yêu cầu xác minh Salon #${currentApproval.owner_id} (${targetSalon?.salonname || targetUser?.fullname || "Salon"})`,
    });

    return enrichSingleApproval(nextApprovals[appIndex]!, nextOwners, users, salons);
  },

  /**
   * Fetch all users with search, role and lock status filters
   */
  async getUsers(filters?: UserFilters): Promise<EnrichedUser[]> {
    await randomDelay(400, 800);
    const users = getStoredUsers();
    const owners = getStoredOwners();
    const salons = getStoredSalons();

    let list = users.map((u) => enrichSingleUser(u, owners, salons));

    // Role filter
    if (filters?.role_id && filters.role_id !== "ALL") {
      const targetRole = Number(filters.role_id);
      list = list.filter((u) => u.role_id === targetRole);
    }

    // Status filter
    if (filters?.status && filters.status !== "ALL") {
      if (filters.status === "active") {
        list = list.filter((u) => !u.is_locked);
      } else if (filters.status === "locked") {
        list = list.filter((u) => !!u.is_locked);
      }
    }

    // Search filter
    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((u) => {
        const idMatch = String(u.user_id).includes(q);
        const usernameMatch = u.username.toLowerCase().includes(q);
        const fullnameMatch = u.fullname?.toLowerCase().includes(q) ?? false;
        const emailMatch = u.email.toLowerCase().includes(q);
        const phoneMatch = u.phone.includes(q);
        const salonMatch = u.salon?.salonname.toLowerCase().includes(q) ?? false;
        return idMatch || usernameMatch || fullnameMatch || emailMatch || phoneMatch || salonMatch;
      });
    }

    return list;
  },

  /**
   * Get user detail by ID
   */
  async getUserById(userId: number): Promise<EnrichedUser | null> {
    await randomDelay(300, 500);
    const users = getStoredUsers();
    const user = users.find((u) => u.user_id === userId);
    if (!user) return null;

    const owners = getStoredOwners();
    const salons = getStoredSalons();

    return enrichSingleUser(user, owners, salons);
  },

  /**
   * Lock a user account
   */
  async lockUser(userId: number, adminId: number): Promise<User> {
    await randomDelay(400, 800);

    if (userId === adminId) {
      throw new Error("Không thể khóa tài khoản Admin đang đăng nhập");
    }

    const users = getStoredUsers();
    const index = users.findIndex((u) => u.user_id === userId);
    if (index === -1) {
      throw new Error("Không tìm thấy tài khoản người dùng");
    }

    const current = users[index]!;
    if (current.is_locked) {
      return current;
    }

    const updated: User = {
      ...current,
      is_locked: true,
    };

    const nextUsers = [...users];
    nextUsers[index] = updated;
    saveStoredUsers(nextUsers);

    // Audit log
    await adminLogService.createLog({
      admin_id: adminId,
      action: `Khóa tài khoản người dùng #${userId} (@${current.username} - ${current.fullname || "N/A"})`,
    });

    return updated;
  },

  /**
   * Unlock a user account
   */
  async unlockUser(userId: number, adminId: number): Promise<User> {
    await randomDelay(400, 800);

    const users = getStoredUsers();
    const index = users.findIndex((u) => u.user_id === userId);
    if (index === -1) {
      throw new Error("Không tìm thấy tài khoản người dùng");
    }

    const current = users[index]!;
    if (!current.is_locked) {
      return current;
    }

    const updated: User = {
      ...current,
      is_locked: false,
    };

    const nextUsers = [...users];
    nextUsers[index] = updated;
    saveStoredUsers(nextUsers);

    // Audit log
    await adminLogService.createLog({
      admin_id: adminId,
      action: `Mở khóa tài khoản người dùng #${userId} (@${current.username})`,
    });

    return updated;
  },

  /**
   * Summary numbers for Admin Top Cards
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    await randomDelay(300, 600);
    const approvals = getStoredApprovals();
    const users = getStoredUsers();
    const salons = getStoredSalons();

    return {
      pendingApprovalsCount: approvals.filter((a) => a.status === "P").length,
      totalUsersCount: users.length,
      totalSalonsCount: salons.length,
      lockedUsersCount: users.filter((u) => !!u.is_locked).length,
    };
  },
};
