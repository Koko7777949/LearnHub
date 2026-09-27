"use client";

import React from "react";
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
import { Loader2 } from "lucide-react";

function AppBody() {
  const { user, view, lang, setLang } = useApp();

  let content: React.ReactNode;
  switch (view) {
    case "login":
      content = <AuthView />;
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
      {content}
    </LanguageProvider>
  );
}

export default function Home() {
  return <AppBody />;
}
