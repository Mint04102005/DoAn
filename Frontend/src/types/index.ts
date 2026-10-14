// Domain types matching the ERD.

export type RoleId = 1 | 2 | 3;
export type Gender = "male" | "female";
export type FaceShape = "Tròn" | "Oval" | "Vuông" | "Trái Tim" | "Dài";
export type BookingStatus = "P" | "C" | "D" | "X";
export type ApprovalStatus = "P" | "A" | "R";

export interface User {
  user_id: number;
  username: string;
  email: string;
  gender: Gender;
  phone: string;
  role_id: RoleId;
  created_at: string;
  is_locked?: boolean;
  avatar_url?: string;
  fullname?: string;
  dob?: string;
  address?: string;
}

export interface SalonOwner {
  owner_id: number;
  user_id: number;
  license_no: string;
  is_verified: boolean;
}

export interface Hairstyle {
  hair_id: number;
  hair_name: string;
  image_url: string;
  gender: Gender;
  description?: string;
}

export interface FaceShapeRow {
  shape_id: number;
  shape_name: FaceShape;
}

export interface HairFaceRule {
  rule_id: number;
  hair_id: number;
  shape_id: number;
  suitability_score: number; // 0..100
}

export interface TryOnHistory {
  history_id: number;
  user_id: number;
  hair_id: number;
  input_img_url: string;
  output_img_url: string;
  saved_at: string;
}

export interface Salon {
  salon_id: number;
  owner_id: number;
  salonname: string;
  address: string;
  rating: number;
  tag: string;
  image_url: string;
  description?: string;
}

export interface Booking {
  booking_id: number;
  user_id: number;
  salon_id: number;
  booking_date: string;
  booking_time?: string;
  notes: string;
  status: BookingStatus;
}

export interface PendingApproval {
  approval_id: number;
  owner_id: number;
  status: ApprovalStatus;
}

export interface RecommendationResult {
  detectedShape: FaceShape;
  confidence: number;
  explanation: string;
  recommendations: Array<{
    hairstyle: Hairstyle;
    score: number;
  }>;
}

export * from "./salon";
export * from "./admin";
