// ═══════════════════════════════════════════
// types/index.ts — Shared TypeScript types
// ═══════════════════════════════════════════

// ─── ENUMS ────────────────────────────────

export enum UserRole {
  PATIENT = 'patient',
  CLINIC_OWNER = 'clinic_owner',
  INVESTOR = 'investor',
  ADMIN = 'admin',
}

export enum Emirate {
  DUBAI = 'dubai',
  ABU_DHABI = 'abu_dhabi',
  SHARJAH = 'sharjah',
  AJMAN = 'ajman',
  UMM_AL_QUWAIN = 'umm_al_quwain',
  FUJAIRAH = 'fujairah',
  RAS_AL_KHAIMAH = 'ras_al_khaimah',
}

export enum ClinicStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export enum SlotStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum InquiryStatus {
  NEW = 'new',
  VIEWED = 'viewed',
  IN_DISCUSSION = 'in_discussion',
  NDA_SIGNED = 'nda_signed',
  OFFER_MADE = 'offer_made',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

// ─── BASE ──────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ─── USER ──────────────────────────────────

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: string;
  profilePhotoUrl?: string;
  languagePreference: string;
  emailVerifiedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── CLINIC ────────────────────────────────

export interface Clinic extends BaseEntity {
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  status: ClinicStatus;
  emirate: Emirate;
  addressLine1?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  dhaLicenseNo?: string;
  isAdminVerified: boolean;
  verifiedAt?: string;
  specialties?: string[];
  languages?: string[];
  ratingAvg: number;
  reviewCount: number;
  bookingCount: number;
  subscriptionTier: string;
  coverPhotoUrl?: string;
  photos?: string[];
  owner?: User;
  ownerId: string;
}

// ─── DOCTOR ────────────────────────────────

export interface Doctor extends BaseEntity {
  clinicId: string;
  fullName: string;
  fullNameAr?: string;
  title?: string;
  specialtyName?: string;
  qualifications?: string[];
  languages?: string[];
  bio?: string;
  photoUrl?: string;
  consultationFee?: number;
  isActive: boolean;
  ratingAvg?: number;
  reviewCount?: number;
}

// ─── SLOT ──────────────────────────────────

export interface Slot extends BaseEntity {
  clinicId: string;
  doctorId?: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  lockedUntil?: string;
  fee?: number;
  notes?: string;
}

export interface SlotsByDate {
  [date: string]: Slot[]; // date key: "2026-04-28"
}

// ─── APPOINTMENT ───────────────────────────

export interface Appointment extends BaseEntity {
  patientId: string;
  patient?: User;
  clinicId: string;
  clinic?: Clinic;
  doctorId?: string;
  slotId: string;
  slot?: Slot;
  status: AppointmentStatus;
  appointmentDate: string;
  reason?: string;
  patientNotes?: string;
  isFirstVisit: boolean;
  feeCharged?: number;
  feePaid: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  confirmedAt?: string;
  completedAt?: string;
}

// ─── INQUIRY ───────────────────────────────

export interface Inquiry extends BaseEntity {
  listingId: string;
  investorId: string;
  investor?: User;
  status: InquiryStatus;
  budgetMin?: number;
  budgetMax?: number;
  stakeInterestPct?: number;
  message: string;
  timeline?: string;
  ndaSignedAt?: string;
  firstViewedAt?: string;
  lastActivityAt: string;
  sellerNotes?: string;
}

// ─── REVIEW ────────────────────────────────

export interface Review extends BaseEntity {
  appointmentId: string;
  patientId: string;
  patient?: User;
  clinicId: string;
  doctorId?: string;
  ratingOverall: number;
  ratingDoctor?: number;
  ratingStaff?: number;
  ratingFacility?: number;
  ratingWaitTime?: number;
  title?: string;
  body?: string;
  isAnonymous: boolean;
  isApproved: boolean;
  clinicResponse?: string;
}

// ─── API RESPONSES ─────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// ─── SEARCH PARAMS ─────────────────────────

export interface ClinicSearchParams {
  q?: string;
  emirate?: Emirate;
  specialties?: string[];
  minRating?: number;
  maxFee?: number;
  language?: string;
  verifiedOnly?: boolean;
  sortBy?: 'rating' | 'price' | 'distance' | 'newest';
  page?: number;
  limit?: number;
}

// ─── FORMS ─────────────────────────────────

export interface RegisterForm {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface BookingForm {
  slotId: string;
  doctorId?: string;
  reason?: string;
  patientNotes?: string;
  isFirstVisit?: boolean;
}

export interface InquiryForm {
  listingId: string;
  budgetMin?: number;
  budgetMax?: number;
  stakeInterestPct?: number;
  message: string;
  timeline?: string;
}
