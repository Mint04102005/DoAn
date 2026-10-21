import type { Booking, BookingStatus, FaceShape, Salon, SalonOwner, User } from "./index";

export type FaceShapeTag = "Tròn" | "Oval" | "Vuông" | "Trái tim" | "Dài";

export interface BookingFilters {
  search?: string;
  status?: BookingStatus | "ALL";
  dateFilter?: "all" | "today" | "tomorrow" | "this_week";
  sortBy?: "date_desc" | "date_asc";
  page?: number;
  limit?: number;
}

export interface EnrichedBooking extends Booking {
  customer?: User;
  salon?: Salon;
}

export interface BookingCounts {
  all: number;
  p: number;
  c: number;
  d: number;
  x: number;
}

export interface SalonBookingsResponse {
  data: EnrichedBooking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: BookingCounts;
}

export interface SalonWithDetails {
  salon: Salon;
  owner: SalonOwner;
  user: User;
}

export interface UpdateSalonProfileInput {
  salonname: string;
  address: string;
  tag: string[] | string;
  description?: string;
  image_url?: string;
}

export interface SalonFilterParams {
  search?: string;
  address?: string;
  tag?: string;
}

export interface SalonDetailData {
  id: number;
  salon_id: number;
  name: string;
  salonname: string;
  address: string;
  phone: string;
  operatingHours?: string | null;
  images: string[];
  image_url: string;
  rating: number;
  status: string;
  tag?: string;
  description?: string;
  createdAt?: string;
  owner?: {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

export interface BackendSalonItem {
  id?: number;
  salon_id?: number;
  name?: string;
  salonname?: string;
  address?: string;
  phone?: string;
  operatingHours?: string | null;
  images?: string[];
  image_url?: string;
  rating?: number;
  status?: string;
  tag?: string;
  description?: string;
  createdAt?: string;
  ownerId?: number;
  owner_id?: number;
  owner?: {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

