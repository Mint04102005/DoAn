import { randomDelay } from "@/lib/delay";
import { MOCK_ADMIN_LOGS, getStorageData, setStorageData } from "@/lib/mock-data";
import type { AdminLog, LogFilters } from "@/types";

const STORAGE_KEY_ADMIN_LOGS = "ai_hairstyle_admin_logs";

function getStoredLogs(): AdminLog[] {
  return getStorageData<AdminLog[]>(STORAGE_KEY_ADMIN_LOGS, MOCK_ADMIN_LOGS);
}

function saveStoredLogs(logs: AdminLog[]): void {
  setStorageData(STORAGE_KEY_ADMIN_LOGS, logs);
}

export const adminLogService = {
  /**
   * Fetch all system audit logs with optional filters and sorting (DESC by created_at)
   */
  async getLogs(filters?: LogFilters): Promise<AdminLog[]> {
    await randomDelay(400, 800);
    let logs = getStoredLogs();

    if (filters?.admin_id && filters.admin_id !== "ALL") {
      const targetAdmin = Number(filters.admin_id);
      logs = logs.filter((l) => l.admin_id === targetAdmin);
    }

    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          String(l.log_id).includes(q) ||
          String(l.admin_id).includes(q),
      );
    }

    if (filters?.dateRange && filters.dateRange !== "ALL") {
      const now = Date.now();
      logs = logs.filter((l) => {
        const time = new Date(l.created_at).getTime();
        if (filters.dateRange === "today") {
          return now - time <= 86400000;
        }
        if (filters.dateRange === "7d") {
          return now - time <= 86400000 * 7;
        }
        if (filters.dateRange === "30d") {
          return now - time <= 86400000 * 30;
        }
        return true;
      });
    }

    // Default sort: created_at DESC
    return [...logs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  /**
   * Create an audit log entry for an admin action
   */
  async createLog(data: { admin_id: number; action: string }): Promise<AdminLog> {
    const logs = getStoredLogs();
    const newLog: AdminLog = {
      log_id: Date.now(),
      admin_id: data.admin_id,
      action: data.action,
      created_at: new Date().toISOString(),
    };

    const nextLogs = [newLog, ...logs];
    saveStoredLogs(nextLogs);
    return newLog;
  },
};
