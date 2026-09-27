"use client";

import React, { useEffect, useRef } from "react";
import { useApp } from "@/store/app";
import { LanguageProvider } from "@/lib/i18n";
import { Marketplace } from "@/components/platform/marketplace";
import { CourseDetail } from "@/components/platform/course-detail";
import { CoursePlayer } from "@/components/platform/course-player";
import { StudentDashboard } from "@/components/platform/student-dashboard";
import { InstructorDashboard } from "@/components/platform/instructor-dashboard";
import { InstructorStudio } from "@/components/platform/instructor-studio";
import { ProfileView } from "@/components/platform/profile-view";
import { RevenueLedger } from "@/components/platform/revenue-ledger";
import { AdminPanel } from "@/components/platform/admin-panel";
import { AuthView } from "@/components/platform/auth-view";
import { CartView } from "@/components/platform/cart-view";
import { AboutView, FaqView } from "@/components/platform/static-pages";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Stripe Checkout lands back on the SPA with ?payment=… — we can't read that
 * inside the zustand store, so this shim component consumes the query param
 * once on mount (cleans the URL afterwards), clears the cart and toasts.
 */
function StripeRedirectHandler() {
  const { user, clearCart, setView } = useApp();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const sp = new URLSearchParams(window.location.search);
    const payment = sp.get("payment");
    if (!payment) return;
    handled.current = true;

    // clean the URL so refreshes don't re-trigger
    window.history.replaceState({}, "", window.location.pathname);

    const count = sp.get("count");
    if (payment === "success") {
      clearCart();
      toast.success(
        count
          ? `Payment complete — ${count} course${count === "1" ? "" : "s"} enrolled 🎉`
          : "Payment complete 🎉",
      );
      if (user) setView("student");
    } else if (payment === "already") {
      toast.info("All courses in this order were already enrolled.");
      if (user) setView("student");
    } else if (payment === "cancelled") {
      toast.info("Checkout cancelled — your cart is saved.");
      setView("cart");
    } else if (payment === "error") {
      toast.error("Payment verification failed. If you were charged, contact support.");
    }
  }, [user, clearCart, setView]);

  return null;
}

function AppBody() {
  const { user, view, lang, setLang } = useApp();

  let content: React.ReactNode;
  switch (view) {
    case "login":
      content = <AuthView />;
      break;
    case "cart":
      content = <CartView />;
      break;
    case "about":
      content = <AboutView />;
      break;
    case "faq":
      content = <FaqView />;
      break;
    case "marketplace":
      content = <Marketplace />;
      break;
    case "course-detail":
      content = <CourseDetail />;
      break;
    case "player":
      content = <CoursePlayer />;
      break;
    case "student":
      content = user ? <StudentDashboard /> : <AuthView />;
      break;
    case "instructor":
      content = user?.role === "INSTRUCTOR" ? <InstructorDashboard /> : <AuthView />;
      break;
    case "studio":
      content = user?.role === "INSTRUCTOR" ? <InstructorStudio /> : <AuthView />;
      break;
    case "profile":
      content = user ? <ProfileView /> : <AuthView />;
      break;
    case "ledger":
      content = user?.role === "INSTRUCTOR" ? <RevenueLedger /> : <AuthView />;
      break;
    case "admin":
      content = user?.role === "ADMIN" ? <AdminPanel /> : <AuthView />;
      break;
    default:
      content = (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      );
  }

  return (
    <LanguageProvider lang={lang} setLang={setLang}>
      <StripeRedirectHandler />
      {content}
    </LanguageProvider>
  );
}

export default function Home() {
  return <AppBody />;
}
