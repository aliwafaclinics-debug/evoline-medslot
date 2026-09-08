import {
  useQuery, useMutation, useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  clinicsApi, slotsApi, bookingsApi,
  inquiriesApi, reviewsApi, authApi,
} from '../lib/api/services';
import type { ClinicSearchParams, BookingForm, InquiryForm, LoginForm, RegisterForm } from '../types';
import { useAuthStore } from '../store/auth.store';

// ─── QUERY KEYS (centralised to avoid typos) ──────────────────────────────

export const queryKeys = {
  clinics: {
    all: ['clinics'] as const,
    search: (params: ClinicSearchParams) => ['clinics', 'search', params] as const,
    detail: (id: string) => ['clinics', id] as const,
    slug: (slug: string) => ['clinics', 'slug', slug] as const,
    mine: () => ['clinics', 'mine'] as const,
  },
  slots: {
    byClinic: (clinicId: string, date?: string) => ['slots', clinicId, date] as const,
    byDoctor: (doctorId: string, from: string, to: string) =>
      ['slots', 'doctor', doctorId, from, to] as const,
  },
  bookings: {
    mine: () => ['bookings', 'mine'] as const,
    clinic: (clinicId: string) => ['bookings', 'clinic', clinicId] as const,
    detail: (id: string) => ['bookings', id] as const,
  },
  inquiries: {
    mine: () => ['inquiries', 'mine'] as const,
    listing: (listingId: string) => ['inquiries', 'listing', listingId] as const,
  },
  reviews: {
    clinic: (clinicId: string) => ['reviews', clinicId] as const,
  },
};

// ─── AUTH HOOKS ────────────────────────────────────────────────────────────

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: LoginForm) => authApi.login(data),
    onSuccess: (res) => setUser(res.user),
  });
}

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: RegisterForm) => authApi.register(data),
    onSuccess: (res) => setUser(res.user),
  });
}

// ─── CLINIC HOOKS ──────────────────────────────────────────────────────────

export function useClinics(params: ClinicSearchParams) {
  return useQuery({
    queryKey: queryKeys.clinics.search(params),
    queryFn: () => clinicsApi.search(params),
    placeholderData: keepPreviousData, // Keeps old data while fetching new page
    staleTime: 30_000, // 30s — clinic list doesn't change that fast
  });
}

export function useClinic(id: string) {
  return useQuery({
    queryKey: queryKeys.clinics.detail(id),
    queryFn: () => clinicsApi.getById(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useClinicBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.clinics.slug(slug),
    queryFn: () => clinicsApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useMyClinic() {
  return useQuery({
    queryKey: queryKeys.clinics.mine(),
    queryFn: clinicsApi.getMyClinic,
    staleTime: 60_000,
  });
}

// ─── SLOT HOOKS ────────────────────────────────────────────────────────────

export function useSlots(clinicId: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.slots.byClinic(clinicId, date),
    queryFn: () => slotsApi.getByClinic(clinicId, date),
    enabled: !!clinicId,
    staleTime: 10_000, // Slots refresh fast — 10s
    refetchInterval: 30_000, // Auto-refresh every 30s to catch bookings
  });
}

// ─── BOOKING HOOKS ─────────────────────────────────────────────────────────

export function useMyAppointments() {
  return useQuery({
    queryKey: queryKeys.bookings.mine(),
    queryFn: bookingsApi.getMyAppointments,
    staleTime: 30_000,
  });
}

export function useClinicAppointments(clinicId: string) {
  return useQuery({
    queryKey: queryKeys.bookings.clinic(clinicId),
    queryFn: () => bookingsApi.getClinicAppointments(clinicId),
    enabled: !!clinicId,
    staleTime: 30_000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookingForm) => bookingsApi.create(data),
    onSuccess: (newBooking) => {
      // Optimistically update the bookings list
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
      // Invalidate slots to reflect the newly booked slot
      queryClient.invalidateQueries({
        queryKey: queryKeys.slots.byClinic(newBooking.clinicId),
      });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsApi.cancel(id, reason),
    onSuccess: (cancelled) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.slots.byClinic(cancelled.clinicId),
      });
    },
  });
}

export function useLockSlot() {
  return useMutation({
    mutationFn: (slotId: string) => slotsApi.lockSlot(slotId),
  });
}

// ─── INQUIRY HOOKS ─────────────────────────────────────────────────────────

export function useMyInquiries() {
  return useQuery({
    queryKey: queryKeys.inquiries.mine(),
    queryFn: inquiriesApi.getMyInquiries,
    staleTime: 60_000,
  });
}

export function useListingInquiries(listingId: string) {
  return useQuery({
    queryKey: queryKeys.inquiries.listing(listingId),
    queryFn: () => inquiriesApi.getByListing(listingId),
    enabled: !!listingId,
    staleTime: 30_000,
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InquiryForm) => inquiriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inquiries.mine() });
    },
  });
}

// ─── REVIEW HOOKS ──────────────────────────────────────────────────────────

export function useClinicReviews(clinicId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.clinic(clinicId),
    queryFn: () => reviewsApi.getByClinic(clinicId),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}
