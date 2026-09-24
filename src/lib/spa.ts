/**
 * Structural spa data — ids, prices, durations, slots, storage.
 *
 * Every user-facing string lives in `@/lib/i18n/dictionary` keyed by the ids
 * below, so adding a language never means touching this file.
 */

export type Category = "all" | "relaxing" | "firm" | "recovery";

export type TreatmentId = "thai" | "oil" | "deep" | "sport" | "combo" | "reflex" | "pregnancy";

export type Treatment = {
  id: TreatmentId;
  category: Exclude<Category, "all">;
  /** Minutes → price in whole euros. The symbol itself is a per-language concern (`t.price`). */
  prices: Record<number, number>;
  durations: number[];
};

export const treatments: Treatment[] = [
  {
    id: "thai",
    category: "firm",
    prices: { 60: 50, 90: 70, 120: 90 },
    durations: [60, 90, 120],
  },
  {
    id: "oil",
    category: "relaxing",
    prices: { 60: 50, 90: 70, 120: 90 },
    durations: [60, 90, 120],
  },
  {
    id: "deep",
    category: "firm",
    prices: { 60: 50, 90: 70, 120: 90 },
    durations: [60, 90, 120],
  },
  {
    id: "sport",
    category: "recovery",
    prices: { 60: 50, 90: 70, 120: 90 },
    durations: [60, 90, 120],
  },
  {
    id: "combo",
    category: "relaxing",
    prices: { 60: 50, 90: 70, 120: 90 },
    durations: [60, 90, 120],
  },
  {
    id: "reflex",
    category: "relaxing",
    prices: { 45: 40, 60: 50, 90: 70 },
    durations: [45, 60, 90],
  },
  {
    id: "pregnancy",
    category: "relaxing",
    prices: { 60: 50, 90: 70 },
    durations: [60, 90],
  },
];

export const categoryIds: Category[] = ["all", "relaxing", "firm", "recovery"];

export type HoursId = "everyday";

export const hours: { id: HoursId; time: string }[] = [
  { id: "everyday", time: "10:00 – 21:00" },
];

export const contact = {
  address: "Rua Do Arco Do Marques De Alegrete 4\nEscritório 2.5\n1100-034 Lisboa, Portugal",
  phone: "+351 927 766 588",
  email: "hello@zambhalathai.com",
};

export const timeSlots = ["10:00", "11:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"];

export type Booking = {
  id: string;
  treatmentId: TreatmentId;
  duration: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = "zambhala-bookings";

export function loadBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Booking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookings(bookings: Booking[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}
