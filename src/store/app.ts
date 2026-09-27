"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser, Lang } from "@/lib/types";

export type View =
  | "marketplace"
  | "course-detail"
  | "student"
  | "instructor"
  | "ledger"
  | "admin"
  | "login";

interface AppState {
  user: SessionUser | null;
  lang: Lang;
  view: View;
  selectedCourseId: string | null;
  ledgerTab: string;
  adminTab: string;
  authMode: "login" | "checkout"; // why we navigated to login
  pendingCourseId: string | null; // course to buy after login

  setUser: (u: SessionUser | null) => void;
  setLang: (l: Lang) => void;
  setView: (v: View) => void;
  openCourse: (id: string) => void;
  setLedgerTab: (t: string) => void;
  setAdminTab: (t: string) => void;
  requestAuthForCheckout: (courseId: string) => void;
  clearCheckoutIntent: () => void;
  logout: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      lang: "en",
      view: "marketplace",
      selectedCourseId: null,
      ledgerTab: "overview",
      adminTab: "overview",
      authMode: "login",
      pendingCourseId: null,

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
      setLedgerTab: (ledgerTab) => set({ ledgerTab }),
      setAdminTab: (adminTab) => set({ adminTab }),
      requestAuthForCheckout: (courseId) =>
        set({ view: "login", authMode: "checkout", pendingCourseId: courseId }),
      clearCheckoutIntent: () => set({ authMode: "login", pendingCourseId: null }),
      logout: () =>
        set({ user: null, view: "marketplace", selectedCourseId: null, authMode: "login", pendingCourseId: null }),
    }),
    {
      name: "learnhub-app",
      partialize: (s) => ({ user: s.user, lang: s.lang }),
    },
  ),
);
