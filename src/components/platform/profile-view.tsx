"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPatch } from "@/hooks/use-api";
import { DashboardShell } from "@/components/platform/app-shell";
import { Avatar, StatCard } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Coins,
  Heart,
  Lock,
  MessageSquareQuote,
  Pencil,
  Rocket,
  Star,
  Users,
} from "lucide-react";
import type { ProfileData } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

export function ProfileView() {
  const { t, lang } = useI18n();
  const { user, setUser } = useApp();
  const { data, loading, refetch } = useApi<ProfileData>(user ? `/api/profile?userId=${user.id}` : null);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const stats = data?.stats;

  const achievements = [
    {
      key: "first-step",
      icon: BookOpen,
      label: t("achFirstEnrollment"),
      unlocked: (stats?.enrollmentCount ?? 0) >= 1 || (stats?.courseCount ?? 0) >= 1,
    },
    {
      key: "learner",
      icon: Users,
      label: t("achThreeCourses"),
      unlocked: (stats?.enrollmentCount ?? 0) >= 3,
    },
    {
      key: "finisher",
      icon: CheckCircle2,
      label: t("achFirstCompletion"),
      unlocked: (stats?.completedCount ?? 0) >= 1,
    },
    {
      key: "reviewer",
      icon: MessageSquareQuote,
      label: t("achReviewer"),
      unlocked: (stats?.reviewCount ?? 0) >= 1,
    },
    {
      key: "curator",
      icon: Heart,
      label: t("achWishlisted"),
      unlocked: (stats?.wishlistCount ?? 0) >= 1,
    },
    {
      key: "creator",
      icon: Rocket,
      label: t("achCreator"),
      unlocked: (stats?.courseCount ?? 0) >= 1,
    },
    {
      key: "author",
      icon: Award,
      label: t("achThreeCoursesCreated"),
      unlocked: (stats?.courseCount ?? 0) >= 3,
    },
    {
      key: "earner",
      icon: Coins,
      label: t("achHighEarner"),
      unlocked: (stats?.lifetimeNet ?? 0) >= 1000,
    },
  ];

  function openEdit() {
    if (!user) return;
    setName(user.name);
    setHeadline(user.headline ?? "");
    setBio((data?.user.bio as string | undefined) ?? "");
    setCountry(user.country ?? "");
    setEditOpen(true);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { ok, data: resp } = await apiPatch<{ user: SessionUser }>("/api/profile", {
      userId: user.id,
      name,
      headline,
      bio,
      country,
    });
    setSaving(false);
    if (ok && resp?.user) {
      setUser(resp.user);
      toast.success(t("profileSaved"));
      setEditOpen(false);
      refetch();
    } else {
      toast.error(t("error"));
    }
  }

  return (
    <DashboardShell
      title={t("profileTitle")}
      subtitle={t("profileSubtitle")}
      actions={
        <Button variant="outline" className="gap-1.5" onClick={openEdit}>
          <Pencil className="h-4 w-4" />
          {t("editProfile")}
        </Button>
      }
    >
      {loading || !data ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-6">
          {/* identity card */}
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
            <div className="px-5 pb-5 sm:px-6">
              <div className="-mt-10 flex flex-wrap items-end gap-4">
                <Avatar name={user.name} color={user.avatarColor} size="lg" className="ring-4 ring-white" />
                <div className="min-w-0 flex-1 pb-1">
                  <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                    {user.name}
                    <BadgeCheck className="h-5 w-5 text-indigo-600" />
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {user.headline || t("noHeadlineYet")}
                  </p>
                </div>
              </div>
              {data.user.bio && (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">{data.user.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <span>
                  {t("colEmail")}: <span className="font-medium text-slate-700">{user.email}</span>
                </span>
                <span>
                  {t("colRole")}: <span className="font-medium text-slate-700">{user.role}</span>
                </span>
                {user.country && (
                  <span>
                    {t("fieldCountry")}: <span className="font-medium text-slate-700">{user.country}</span>
                  </span>
                )}
                <span>
                  {t("memberSince")}:{" "}
                  <span className="font-medium text-slate-700">{fmtDate(data.user.createdAt, lang)}</span>
                </span>
              </div>
            </div>
          </section>

          {/* stats */}
          <section aria-label={t("myStats")}>
            <h3 className="mb-3 text-base font-bold text-slate-900">{t("myStats")}</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {user.role === "INSTRUCTOR" || user.role === "ADMIN" ? (
                <>
                  <StatCard label={t("statCourses")} value={stats?.courseCount ?? 0} icon={Rocket} tone="info" />
                  <StatCard label={t("statTotalStudents")} value="—" icon={Users} />
                  <StatCard
                    label={t("statLifetime")}
                    value={fmtMoney(stats?.lifetimeNet ?? 0)}
                    icon={Coins}
                    tone="positive"
                  />
                  <StatCard label={t("statAvgRating")} value={<StarRow />} icon={Star} />
                </>
              ) : (
                <>
                  <StatCard label={t("enrolledCourses")} value={stats?.enrollmentCount ?? 0} icon={BookOpen} tone="info" />
                  <StatCard label={t("completedCourses")} value={stats?.completedCount ?? 0} icon={CheckCircle2} tone="positive" />
                  <StatCard label={t("totalSpent")} value={fmtMoney(stats?.totalSpent ?? 0)} icon={Coins} />
                  <StatCard label={t("wishlist")} value={stats?.wishlistCount ?? 0} icon={Heart} tone="warning" />
                </>
              )}
            </div>
          </section>

          {/* achievements */}
          <section aria-label={t("achievements")}>
            <h3 className="mb-3 text-base font-bold text-slate-900">{t("achievements")}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {achievements.map((a) => (
                <div
                  key={a.key}
                  className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                    a.unlocked
                      ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm"
                      : "border-slate-200 bg-slate-50/60 opacity-70"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      a.unlocked ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {a.unlocked ? <a.icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${a.unlocked ? "text-slate-900" : "text-slate-500"}`}>
                      {a.label}
                    </p>
                    <p className={`text-[11px] font-medium ${a.unlocked ? "text-amber-600" : "text-slate-400"}`}>
                      {a.unlocked ? "✓" : t("lockedAch")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editProfile")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="p-name">{t("colUser")}</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-headline">{t("fieldHeadline")}</Label>
              <Input
                id="p-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={t("fieldHeadlinePlaceholder")}
                maxLength={160}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-bio">{t("fieldBio")}</Label>
              <Textarea
                id="p-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("fieldBioPlaceholder")}
                rows={4}
                className="resize-none"
                maxLength={1000}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-country">{t("fieldCountry")}</Label>
              <Input
                id="p-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                {t("cancel")}
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={save} disabled={saving}>
                {saving ? "…" : t("saveProfile")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function StarRow() {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
      <span className="text-base">4.7</span>
    </span>
  );
}
