import { apiClient, setTokens, clearTokens } from './client';
import type {
  AuthTokens, User, Clinic, Slot, Appointment,
  Inquiry, Review, PaginatedResponse,
  ClinicSearchParams, BookingForm, InquiryForm,
  RegisterForm, LoginForm,
} from '../../types';

const V1 = '/v1';

// ─── AUTH ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (data: RegisterForm): Promise<AuthTokens> => {
    const res = await apiClient.post<AuthTokens>(`${V1}/auth/register`, data);
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  login: async (data: LoginForm): Promise<AuthTokens> => {
    const res = await apiClient.post<AuthTokens>(`${V1}/auth/login`, data);
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  logout: () => clearTokens(),

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>(`${V1}/auth/me`);
    return res.data;
  },
};

// ─── CLINICS ───────────────────────────────────────────────────────────────

export const clinicsApi = {
  search: async (params: ClinicSearchParams): Promise<PaginatedResponse<Clinic>> => {
    // Serialize arrays for query string
    const queryParams: Record<string, any> = { ...params };
    if (params.specialties?.length) {
      queryParams.specialties = params.specialties.join(',');
    }
    const res = await apiClient.get<PaginatedResponse<Clinic>>(`${V1}/clinics`, {
      params: queryParams,
    });
    return res.data;
  },

  getById: async (id: string): Promise<Clinic> => {
    const res = await apiClient.get<Clinic>(`${V1}/clinics/${id}`);
    return res.data;
  },

  getBySlug: async (slug: string): Promise<Clinic> => {
    const res = await apiClient.get<Clinic>(`${V1}/clinics/slug/${slug}`);
    return res.data;
  },

  create: async (data: Partial<Clinic>): Promise<Clinic> => {
    const res = await apiClient.post<Clinic>(`${V1}/clinics`, data);
    return res.data;
  },

  update: async (id: string, data: Partial<Clinic>): Promise<Clinic> => {
    const res = await apiClient.put<Clinic>(`${V1}/clinics/${id}`, data);
    return res.data;
  },

  getMyClinic: async (): Promise<Clinic | null> => {
    const res = await apiClient.get<Clinic>(`${V1}/clinics/my/clinic`);
    return res.data;
  },
};

// ─── SLOTS ─────────────────────────────────────────────────────────────────

export const slotsApi = {
  getByClinic: async (clinicId: string, date?: string): Promise<Slot[]> => {
    const res = await apiClient.get<Slot[]>(`${V1}/slots/clinic/${clinicId}`, {
      params: { date },
    });
    return res.data;
  },

  getByDoctor: async (doctorId: string, from: string, to: string): Promise<Slot[]> => {
    const res = await apiClient.get<Slot[]>(`${V1}/slots/doctor/${doctorId}`, {
      params: { from, to },
    });
    return res.data;
  },

  lockSlot: async (slotId: string): Promise<{ lockedUntil: string }> => {
    const res = await apiClient.post(`${V1}/bookings/lock-slot`, { slotId });
    return res.data;
  },

  createBulk: async (clinicId: string, data: {
    doctorId: string;
    dates: string[];
    startHour: number;
    endHour: number;
    slotDurationMinutes: number;
    fee: number;
  }): Promise<Slot[]> => {
    const res = await apiClient.post<Slot[]>(`${V1}/slots/bulk`, {
      clinicId,
      ...data,
    });
    return res.data;
  },
};

// ─── BOOKINGS ──────────────────────────────────────────────────────────────

export const bookingsApi = {
  create: async (data: BookingForm): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>(`${V1}/bookings`, data);
    return res.data;
  },

  getMyAppointments: async (): Promise<Appointment[]> => {
    const res = await apiClient.get<Appointment[]>(`${V1}/bookings/my`);
    return res.data;
  },

  getClinicAppointments: async (clinicId: string): Promise<Appointment[]> => {
    const res = await apiClient.get<Appointment[]>(
      `${V1}/bookings/clinic/${clinicId}`,
    );
    return res.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const res = await apiClient.get<Appointment>(`${V1}/bookings/${id}`);
    return res.data;
  },

  cancel: async (id: string, reason?: string): Promise<Appointment> => {
    const res = await apiClient.patch<Appointment>(
      `${V1}/bookings/${id}/cancel`,
      { reason },
    );
    return res.data;
  },

  confirm: async (id: string): Promise<Appointment> => {
    const res = await apiClient.patch<Appointment>(
      `${V1}/bookings/${id}/confirm`,
    );
    return res.data;
  },
};

// ─── INQUIRIES ─────────────────────────────────────────────────────────────

export const inquiriesApi = {
  create: async (data: InquiryForm): Promise<Inquiry> => {
    const res = await apiClient.post<Inquiry>(`${V1}/inquiries`, data);
    return res.data;
  },

  getMyInquiries: async (): Promise<Inquiry[]> => {
    const res = await apiClient.get<Inquiry[]>(`${V1}/inquiries/my`);
    return res.data;
  },

  getByListing: async (listingId: string): Promise<Inquiry[]> => {
    const res = await apiClient.get<Inquiry[]>(
      `${V1}/inquiries/listing/${listingId}`,
    );
    return res.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    sellerNotes?: string,
  ): Promise<Inquiry> => {
    const res = await apiClient.patch<Inquiry>(`${V1}/inquiries/${id}/status`, {
      status,
      sellerNotes,
    });
    return res.data;
  },
};

// ─── REVIEWS ───────────────────────────────────────────────────────────────

export const reviewsApi = {
  getByClinic: async (clinicId: string): Promise<Review[]> => {
    const res = await apiClient.get<Review[]>(
      `${V1}/reviews/clinic/${clinicId}`,
    );
    return res.data;
  },

  create: async (data: {
    appointmentId: string;
    ratingOverall: number;
    ratingDoctor?: number;
    ratingStaff?: number;
    ratingFacility?: number;
    ratingWaitTime?: number;
    title?: string;
    body?: string;
    isAnonymous?: boolean;
  }): Promise<Review> => {
    const res = await apiClient.post<Review>(`${V1}/reviews`, data);
    return res.data;
  },
};
