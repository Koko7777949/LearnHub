"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser, Lang } from "@/lib/types";

export type View =
  | "marketplace"
  | "course-detail"
  | "player"
  | "student"
  | "instructor"
  | "studio"
  | "ledger"
  | "admin"
  | "profile"
  | "cart"
  | "about"
  | "faq"
  | "login";

export interface CartItem {
  courseId: string;
  addedAt: number;
}

interface AppState {
  user: SessionUser | null;
  lang: Lang;
  view: View;
  selectedCourseId: string | null;
  learningCourseId: string | null;
  learningLessonId: string | null;
  ledgerTab: string;
  adminTab: string;
  authMode: "login" | "checkout"; // why we navigated to login
  pendingCourseId: string | null; // course to buy after login
  cart: CartItem[];

  setUser: (u: SessionUser | null) => void;
  setLang: (l: Lang) => void;
  setView: (v: View) => void;
  openCourse: (id: string) => void;
  openLearning: (courseId: string, lessonId?: string) => void;
  setLedgerTab: (t: string) => void;
  setAdminTab: (t: string) => void;
  requestAuthForCheckout: (courseId: string) => void;
  clearCheckoutIntent: () => void;
  addToCart: (courseId: string) => boolean;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  logout: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      lang: "en",
      view: "marketplace",
      selectedCourseId: null,
      learningCourseId: null,
      learningLessonId: null,
      ledgerTab: "overview",
      adminTab: "overview",
      authMode: "login",
      pendingCourseId: null,
      cart: [],

      setUser: (u) =>
        set({
          user: u,
          view: u
            ? u.role === "ADMIN"
              ? "admin"
              : u.role === "INSTRUCTOR"
                ? "instructor"
                : "student"
            : "marketplace",
        }),
      setLang: (lang) => set({ lang }),
      setView: (view) => set({ view }),
      openCourse: (id) => set({ view: "course-detail", selectedCourseId: id }),
      openLearning: (courseId, lessonId) =>
        set({ view: "player", learningCourseId: courseId, learningLessonId: lessonId ?? null }),
      setLedgerTab: (ledgerTab) => set({ ledgerTab }),
      setAdminTab: (adminTab) => set({ adminTab }),
      requestAuthForCheckout: (courseId) =>
        set({ view: "login", authMode: "checkout", pendingCourseId: courseId }),
      clearCheckoutIntent: () => set({ authMode: "login", pendingCourseId: null }),
      addToCart: (courseId) => {
        let added = false;
        set((s) => {
          if (s.cart.some((i) => i.courseId === courseId)) return s;
          added = true;
          return { cart: [...s.cart, { courseId, addedAt: Date.now() }] };
        });
        return added;
      },
      removeFromCart: (courseId) => set((s) => ({ cart: s.cart.filter((i) => i.courseId !== courseId) })),
      clearCart: () => set({ cart: [] }),
      logout: () =>
        set({
          user: null,
          view: "marketplace",
          selectedCourseId: null,
          learningCourseId: null,
          learningLessonId: null,
          authMode: "login",
          pendingCourseId: null,
        }),
    }),
    {
      name: "learnhub-app",
      partialize: (s) => ({ user: s.user, lang: s.lang, cart: s.cart }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          // guard against unknown/stale persisted language codes
          lang: ["en", "zh", "ar", "fr", "es", "de", "pt", "ru", "ja", "ko", "tr", "hi"].includes(
            p.lang as string,
          )
            ? (p.lang as AppState["lang"])
            : "en",
        };
      },
    },
  ),
);
