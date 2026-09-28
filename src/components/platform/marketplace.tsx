"use client";

import React, { useMemo, useState } from "react";
import { useI18n, trCategory, trLevel, localeOf } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost } from "@/hooks/use-api";
import { CourseCard } from "@/components/platform/course-card";
import { TopHeader, SiteFooter } from "@/components/platform/app-shell";
import { EmptyState } from "@/components/platform/ui-bits";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, Search, Sparkles, Star, Tag, Users, FilterX } from "lucide-react";
import type { CourseWithInstructor } from "@/lib/types";

const CATEGORIES = ["ALL", "Development", "Design", "Data Science", "IT & Software", "Marketing", "Business"];
const LEVELS = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"];
const SORTS = [
  { value: "popular", key: "sortPopular" },
  { value: "newest", key: "sortNewest" },
  { value: "rating", key: "sortRating" },
  { value: "price-asc", key: "sortPriceLow" },
  { value: "price-desc", key: "sortPriceHigh" },
] as const;

export function Marketplace() {
  const { t, lang } = useI18n();
  const { user, setView } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [sort, setSort] = useState("popular");

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (category !== "ALL") p.set("category", category);
    if (level !== "ALL") p.set("level", level);
    p.set("sort", sort);
    return `/api/courses?${p.toString()}`;
  }, [search, category, level, sort]);

  const { data, loading } = useApi<{ courses: CourseWithInstructor[] }>(url);
  const courses = data?.courses || [];

  // wishlist state for students
  const { data: wishData, refetch: refetchWishlist } = useApi<{ wishlist: { courseId: string }[] }>(
    user?.role === "STUDENT" ? `/api/wishlist?studentId=${user.id}` : null,
  );
  const wishedIds = useMemo(() => new Set((wishData?.wishlist || []).map((w) => w.courseId)), [wishData]);

  async function toggleWishlist(courseId: string) {
    if (!user) return;
    const { ok, data: resp } = await apiPost<{ wishlisted: boolean }>("/api/wishlist", {
      studentId: user.id,
      courseId,
    });
    if (ok && resp) {
      toast.success(resp.wishlisted ? t("wishlistedToast") : t("unWishlistedToast"));
      refetchWishlist();
    } else {
      toast.error(t("error"));
    }
  }

  const totals = useMemo(() => {
    const students = courses.reduce((s, c) => s + c.studentsCount, 0);
    const avg = courses.length ? courses.reduce((s, c) => s + c.rating, 0) / courses.length : 0;
    return { students, avg };
  }, [courses]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopHeader onSearch={setSearch} />

      {/* hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-indigo-50/80 via-white to-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              {t("heroBadge")}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {t("heroTitle1")}{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                {t("heroTitle2")}
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{t("heroSubtitle")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-10">
              <div>
                <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{courses.length}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{t("heroStatCourses")}</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {totals.students.toLocaleString(localeOf(lang))}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{t("heroStatStudents")}</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="flex items-center gap-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {totals.avg.toFixed(1)}
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{t("heroStatRating")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* promo strip */}
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-center sm:px-6 lg:px-8">
          <Tag className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <p className="text-xs font-semibold text-white sm:text-sm">{t("promoBanner")}</p>
          <button
            type="button"
            onClick={() => setView("cart")}
            className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur transition hover:bg-white/25"
          >
            {t("promoBannerCta")}
          </button>
        </div>
      </div>

      {/* filters */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Course filters">
        <div className="sticky top-16 z-20 -mx-4 bg-white/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    category === c
                      ? "bg-slate-900 text-white shadow"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {c === "ALL" ? t("all") : trCategory(c, lang)}
                </button>
              ))}
            </div>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger size="sm" className="h-8 w-[130px] text-xs" aria-label={t("levelLabel")}>
                <SelectValue placeholder={t("levelLabel")} />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {l === "ALL" ? `${t("levelLabel")}: ${t("all")}` : trLevel(l, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger size="sm" className="h-8 w-[150px] text-xs" aria-label={t("sortLabel")}>
                <SelectValue placeholder={t("sortLabel")} />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {t(s.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-slate-900">{courses.length}</span> {t("resultsFound")}
          </p>
          {(search || category !== "ALL" || level !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
                setLevel("ALL");
              }}
            >
              <FilterX className="h-3.5 w-3.5" />
              {t("clearFilters")}
            </Button>
          )}
        </div>

        {/* grid */}
        <div className="pb-16">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border">
                  <Skeleton className="h-36 w-full rounded-none" />
                  <div className="space-y-2.5 p-4">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t("noCourses")}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategory("ALL");
                    setLevel("ALL");
                  }}
                >
                  {t("clearFilters")}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  wishlisted={wishedIds.has(c.id)}
                  onToggleWishlist={user?.role === "STUDENT" ? toggleWishlist : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-slate-200 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t("teachCtaTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              {t("teachCtaBody")}
            </p>
          </div>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setView("login")}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {t("aboutStartTeaching")}
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
