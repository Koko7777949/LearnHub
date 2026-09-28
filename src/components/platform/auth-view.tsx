"use client";

import React, { useState } from "react";
import { useApp } from "@/store/app";
import { useI18n } from "@/lib/i18n";
import { apiPost } from "@/hooks/use-api";
import { Avatar } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, GraduationCap, LineChart, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SessionUser } from "@/lib/types";

const demoAccounts = [
  {
    email: "sarah@learnhub.dev",
    name: "Sarah Chen",
    roleKey: "roleInstructor" as const,
    icon: LineChart,
    color: "indigo",
    noteKey: "demoNoteInstructor" as const,
  },
  {
    email: "liam@student.dev",
    name: "Liam Petrov",
    roleKey: "roleStudent" as const,
    icon: GraduationCap,
    color: "blue",
    noteKey: "demoNoteStudent" as const,
  },
  {
    email: "admin@learnhub.dev",
    name: "Marcus Webb",
    roleKey: "roleAdmin" as const,
    icon: ShieldCheck,
    color: "slate",
    noteKey: "demoNoteAdmin" as const,
  },
];

export function AuthView() {
  const { t } = useI18n();
  const { setUser, view, pendingCourseId, clearCheckoutIntent, openCourse } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const isCheckout = view === "login" && !!pendingCourseId;

  async function login(mail: string, pass: string, tag: string) {
    setBusy(tag);
    const { ok, data } = await apiPost<{ user: SessionUser }>("/api/auth/login", {
      email: mail,
      password: pass,
    });
    setBusy(null);
    if (!ok || !data?.user) {
      toast.error(t("invalidCreds"));
      return;
    }
    setUser(data.user);
    if (pendingCourseId) {
      const cid = pendingCourseId;
      clearCheckoutIntent();
      openCourse(cid);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* left branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="authgrid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0v32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#authgrid)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">LearnHub</span>
        </div>
        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            {t("authMarketingTitle")}
          </h2>
          <p className="text-lg leading-relaxed text-white/80">
            {t("authMarketingBody")}
          </p>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <Sparkles className="h-5 w-5 shrink-0" />
            <p className="text-sm text-white/90">
              {t("authMarketingFeatures")}
            </p>
          </div>
        </div>
        <p className="relative text-sm text-white/60">© 2026 LearnHub — {t("footerRights")}</p>
      </div>

      {/* right login panel */}
      <div className="flex w-full items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold text-slate-900">LearnHub</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("loginTitle")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("loginSubtitle")}</p>

          {isCheckout && (
            <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              {t("authCheckoutReturn")}
            </div>
          )}

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login(email, password, "form");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="demo123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={busy === "form"}>
              {busy === "form" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy === "form" ? t("signingIn") : t("signIn")}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">{t("quickLogin")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => login(acc.email, "demo123", acc.email)}
                disabled={!!busy}
                className="flex w-full items-center gap-3 rounded-xl border bg-white p-3.5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md disabled:opacity-60"
              >
                <Avatar name={acc.name} color={acc.color} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{acc.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(acc.roleKey)} · {t(acc.noteKey)}
                  </p>
                </div>
                {busy === acc.email ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                ) : (
                  <acc.icon className="h-5 w-5 text-slate-400" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">{t("quickLoginHint")}</p>
        </div>
      </div>
    </div>
  );
}
