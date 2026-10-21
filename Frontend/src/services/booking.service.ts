import { randomDelay } from "@/lib/delay";
import { MOCK_BOOKINGS, MOCK_USERS, getStorageData, setStorageData } from "@/lib/mock-data";
import type {
  Booking,
  BookingFilters,
  BookingStatus,
  EnrichedBooking,
  SalonBookingsResponse,
  User,
} from "@/types";

const STORAGE_KEY_BOOKINGS = "ai_hairstyle_bookings";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getStoredBookings(): Booking[] {
  return getStorageData<Booking[]>(STORAGE_KEY_BOOKINGS, MOCK_BOOKINGS);
}

function saveStoredBookings(bookings: Booking[]): void {
  setStorageData(STORAGE_KEY_BOOKINGS, bookings);
}

interface CreateBookingPayload {
  user_id: number;
  salon_id: number;
  booking_date: string;
  booking_time?: string;
  notes: string;
}

export const bookingService = {
  /**
   * Fetch all bookings for a specific salon, applying filters and pagination at service level.
   * Enforces data isolation so salon owners cannot view bookings belonging to other salons.
   */
  async getSalonBookings(
    salonId: number,
    filters: BookingFilters = {},
  ): Promise<SalonBookingsResponse> {
    await randomDelay(400, 800);

    const allBookings = getStoredBookings();
    const allUsers = MOCK_USERS;

    // Scope boundary: Strictly filter by salonId
    const salonOnlyBookings = allBookings.filter((b) => b.salon_id === salonId);

    // Calculate total counts for badges/tabs
    const counts = {
      all: salonOnlyBookings.length,
      p: salonOnlyBookings.filter((b) => b.status === "P").length,
      c: salonOnlyBookings.filter((b) => b.status === "C").length,
      d: salonOnlyBookings.filter((b) => b.status === "D").length,
      x: salonOnlyBookings.filter((b) => b.status === "X").length,
    };

    // Enrich with customer details
    const enrichedList: EnrichedBooking[] = salonOnlyBookings.map((b) => {
      const customer = allUsers.find((u) => u.user_id === b.user_id);
      return {
        ...b,
        customer,
      };
    });

    // Apply Status Filter
    let filtered = enrichedList;
    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter((b) => b.status === filters.status);
    }

    // Apply Search Filter (Customer name, username, phone, or notes)
    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter((b) => {
        const customer = b.customer;
        const nameMatch = customer?.fullname?.toLowerCase().includes(q) ?? false;
        const userMatch = customer?.username?.toLowerCase().includes(q) ?? false;
        const phoneMatch = customer?.phone?.toLowerCase().includes(q) ?? false;
        const notesMatch = b.notes.toLowerCase().includes(q);
        return nameMatch || userMatch || phoneMatch || notesMatch;
      });
    }

    // Apply Date Quick Filter
    if (filters.dateFilter && filters.dateFilter !== "all") {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0]!;
      const tomorrow = new Date(Date.now() + 86400000);
      const tomorrowStr = tomorrow.toISOString().split("T")[0]!;

      if (filters.dateFilter === "today") {
        filtered = filtered.filter((b) => b.booking_date.startsWith(todayStr));
      } else if (filters.dateFilter === "tomorrow") {
        filtered = filtered.filter((b) => b.booking_date.startsWith(tomorrowStr));
      } else if (filters.dateFilter === "this_week") {
        // Next 7 days
        const sevenDaysLater = new Date(Date.now() + 7 * 86400000);
        filtered = filtered.filter((b) => {
          const bDate = new Date(b.booking_date);
          return bDate >= new Date(todayStr) && bDate <= sevenDaysLater;
        });
      }
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      const timeA = `${a.booking_date}T${a.booking_time || "00:00"}`;
      const timeB = `${b.booking_date}T${b.booking_time || "00:00"}`;
      const diff = new Date(timeB).getTime() - new Date(timeA).getTime();
      return filters.sortBy === "date_asc" ? -diff : diff;
    });

    const total = filtered.length;
    const limit = filters.limit || 10;
    const page = Math.max(1, filters.page || 1);
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedData = filtered.slice(offset, offset + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
      counts,
    };
  },

  /**
   * Update the status of a booking with role-based business rules.
   */
  async updateBookingStatus(
    bookingId: number,
    newStatus: BookingStatus,
    salonId?: number,
  ): Promise<Booking> {
    await randomDelay(400, 700);

    const allBookings = getStoredBookings();
    const index = allBookings.findIndex((b) => b.booking_id === bookingId);

    if (index === -1) {
      throw new Error("Không tìm thấy lịch hẹn");
    }

    const currentBooking = allBookings[index]!;

    // Salon isolation check
    if (salonId !== undefined && currentBooking.salon_id !== salonId) {
      throw new Error("Bạn không có quyền chỉnh sửa lịch hẹn của salon khác");
    }

    // Business Rules:
    // P -> C or X
    // C -> D or X
    // D & X cannot be changed
    if (currentBooking.status === "D") {
      throw new Error("Lịch hẹn đã hoàn thành, không thể thay đổi trạng thái");
    }
    if (currentBooking.status === "X") {
      throw new Error("Lịch hẹn đã bị hủy, không thể thay đổi trạng thái");
    }

    const updatedBooking: Booking = {
      ...currentBooking,
      status: newStatus,
    };

    const nextBookings = [...allBookings];
    nextBookings[index] = updatedBooking;
    saveStoredBookings(nextBookings);

    return updatedBooking;
  },

  /**
   * Get single booking detail by ID with customer info
   * GET /api/bookings/:id
   */
  async getBookingById(bookingId: number, salonId?: number): Promise<EnrichedBooking | null> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const raw = await res.json();
          const b = raw.data || raw;
          if (salonId !== undefined && (b.salon_id ?? b.salonId) !== salonId) {
            return null;
          }
          return {
            booking_id: b.id ?? b.booking_id,
            user_id: b.userId ?? b.user_id,
            salon_id: b.salonId ?? b.salon_id,
            booking_date: b.booking_date || (b.bookingDate ? new Date(b.bookingDate).toISOString() : ""),
            booking_time: b.booking_time || "09:00",
            notes: b.notes || "",
            status: b.status || "P",
            customer: b.user
              ? {
                  user_id: b.user.id ?? b.user.user_id,
                  username: b.user.name || b.user.username || "Khách hàng",
                  fullname: b.user.name || b.user.fullname || "Khách hàng",
                  email: b.user.email || "",
                  phone: b.user.phone || "",
                  avatar_url: b.user.avatarUrl || b.user.avatar_url || "",
                  role_id: 2,
                  created_at: new Date().toISOString(),
                }
              : undefined,
            salon: b.salon,
          };
        }
      } catch {
        // Fallback to local storage if network error
      }
    }

    await randomDelay(200, 400);

    const allBookings = getStoredBookings();
    const booking = allBookings.find((b) => b.booking_id === bookingId);

    if (!booking) return null;
    if (salonId !== undefined && booking.salon_id !== salonId) {
      return null;
    }

    const customer = MOCK_USERS.find((u) => u.user_id === booking.user_id);
    return {
      ...booking,
      customer,
    };
  },

  /**
   * Create a new booking
   * POST /api/bookings
   */
  async create(payload: CreateBookingPayload): Promise<Booking> {
    const token = getAuthToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          salonId: payload.salon_id,
          bookingDate: payload.booking_date,
          notes: payload.notes || "Đặt lịch làm tóc",
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = Array.isArray(resData.message)
          ? resData.message.join(", ")
          : resData.message || `Đặt lịch thất bại (${res.status})`;
        throw new Error(errorMessage);
      }

      const raw = resData.data || resData;
      return {
        booking_id: raw.id ?? raw.booking_id,
        user_id: raw.userId ?? raw.user_id ?? payload.user_id,
        salon_id: raw.salonId ?? raw.salon_id ?? payload.salon_id,
        booking_date: raw.booking_date || payload.booking_date,
        booking_time: raw.booking_time || payload.booking_time || "09:00",
        notes: raw.notes || payload.notes,
        status: raw.status || "P",
      };
    }

    await randomDelay(600, 1200);
    const allBookings = getStoredBookings();
    const booking: Booking = {
      ...payload,
      booking_id: Date.now(),
      status: "P",
    };
    const nextBookings = [booking, ...allBookings];
    saveStoredBookings(nextBookings);
    return booking;
  },

  /**
   * List bookings made by a user
   * GET /api/bookings/my-bookings
   */
  async listByUser(user_id: number, status?: string): Promise<Booking[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const url = status
          ? `${API_BASE_URL}/bookings/my-bookings?status=${status}`
          : `${API_BASE_URL}/bookings/my-bookings`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const resData = await res.json();
          const list = Array.isArray(resData) ? resData : resData.data || [];
          return list.map((raw: any) => ({
            booking_id: raw.id ?? raw.booking_id,
            user_id: raw.userId ?? raw.user_id,
            salon_id: raw.salonId ?? raw.salon_id,
            booking_date: raw.booking_date || (raw.bookingDate ? new Date(raw.bookingDate).toISOString() : ""),
            booking_time: raw.booking_time || "09:00",
            notes: raw.notes || "",
            status: raw.status || "P",
          }));
        }
      } catch {
        // Fallback to local storage if network error
      }
    }

    await randomDelay(300, 600);
    const allBookings = getStoredBookings();
    return allBookings
      .filter((b) => b.user_id === user_id)
      .sort((a, b) => +new Date(b.booking_date) - +new Date(a.booking_date));
  },
};
