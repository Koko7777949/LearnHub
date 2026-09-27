"use client";

import React, { useMemo, useState } from "react";
import { useI18n, trLevel } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost } from "@/hooks/use-api";
import { TopHeader, SiteFooter } from "@/components/platform/app-shell";
import { Avatar, CourseCover, Rating, StatusBadge } from "@/components/platform/ui-bits";
import { CourseReviews } from "@/components/platform/reviews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Clock,
  Globe,
  Heart,
  Infinity as InfinityIcon,
  Loader2,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { CourseWithInstructor, Lesson, StudentPurchase } from "@/lib/types";

type CourseDetail = CourseWithInstructor & { lessons: Lesson[] };

export function CourseDetail() {
  const { t, lang } = useI18n();
  const { selectedCourseId, user, requestAuthForCheckout, openCourse, openLearning, setView } = useApp();
  const [purchasing, setPurchasing] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);

  const { data, loading } = useApi<{ course: CourseDetail }>(
    selectedCourseId ? `/api/courses/${selectedCourseId}` : null,
  );
  const course = data?.course;

  const { data: myData } = useApi<{ purchases: StudentPurchase[] }>(
    user?.role === "STUDENT" ? `/api/enrollments?studentId=${user.id}` : null,
  );

  // wishlist state (students only)
  const { data: wishData, refetch: refetchWishlist } = useApi<{ wishlist: { courseId: string }[] }>(
    user?.role === "STUDENT" && course ? `/api/wishlist?studentId=${user.id}` : null,
  );
  const wished = useMemo(
    () => !!(wishData?.wishlist || []).some((w) => w.courseId === selectedCourseId),
    [wishData, selectedCourseId],
  );

  async function toggleWishlist() {
    if (!user || !course) return;
    if (user.role !== "STUDENT") return;
    const { ok, data: resp } = await apiPost<{ wishlisted: boolean }>("/api/wishlist", {
      studentId: user.id,
      courseId: course.id,
    });
    if (ok && resp) {
      toast.success(resp.wishlisted ? t("wishlistedToast") : t("unWishlistedToast"));
      refetchWishlist();
    } else {
      toast.error(t("error"));
    }
  }

  // derived ownership: purchases list OR a just-completed purchase
  const owned = useMemo(() => {
    if (!course) return false;
    if (justPurchased) return true;
    if (user?.role !== "STUDENT" || !myData?.purchases) return false;
    return myData.purchases.some((p) => p.course.id === course.id);
  }, [course, justPurchased, user, myData]);

  async function buy() {
    if (!course) return;
    if (!user || user.role !== "STUDENT") {
      requestAuthForCheckout(course.id);
      return;
    }
    setPurchasing(true);
    const { ok, status } = await apiPost("/api/enrollments", { studentId: user.id, courseId: course.id });
    setPurchasing(false);
    if (ok) {
      setJustPurchased(true);
      toast.success(t("purchaseSuccess"));
    } else if (status === 409) {
      setJustPurchased(true);
      toast.info(t("alreadyOwned"));
    } else {
      toast.error(t("error"));
    }
  }

  if (loading || !course) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <TopHeader />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const previewLessons = course.lessons.slice(0, 3);
  const grouped = [course.lessons];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopHeader />

      {/* breadcrumb bar */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/60 to-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-sm sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600" onClick={() => setView("marketplace")}>
            <ArrowLeft className="h-4 w-4" />
            {t("navMarketplace")}
          </Button>
          <span className="text-slate-300">/</span>
          <span className="truncate font-medium text-slate-800">{course.title}</span>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-12">
        {/* main column */}
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{course.category}</span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
              {trLevel(course.level, lang)}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{course.subtitle}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <Rating value={course.rating} count={course.ratingCount} />
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              {course.studentsCount.toLocaleString(lang === "zh" ? "zh-CN" : "en-US")} {t("studentsCount")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-slate-400" />
              {course.lessonsCount} {t("totalLessons")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              {Math.round(course.durationMinutes / 60)} {t("hoursLabel")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-slate-400" />
              {course.language}
            </span>
          </div>

          {/* instructor */}
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <Avatar name={course.instructor.name} color={course.instructor.avatarColor} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{course.instructor.name}</p>
              <p className="truncate text-xs text-muted-foreground">{course.instructor.headline}</p>
            </div>
          </div>

          {/* description */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">{t("whatYouLearn")}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              {course.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </section>

          {/* curriculum */}
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t("curriculum")}</h2>
              <span className="text-xs text-muted-foreground">
                {course.lessonsCount} {t("totalLessons")}
              </span>
            </div>
            <Accordion type="multiple" defaultValue={["curriculum"]} className="mt-3">
              {grouped.map((lessons, gi) => (
                <AccordionItem key={gi} value="curriculum" className="border-slate-200">
                  <AccordionTrigger className="py-3.5 text-sm font-semibold text-slate-900 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-indigo-600" />
                      {lang === "zh" ? "课程章节" : "Course sections"}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="divide-y divide-slate-100">
                      {lessons.map((l) => {
                        const previewable = l.isPreview;
                        return (
                          <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 pl-8 pr-2">
                            <button
                              type="button"
                              onClick={() => previewable && openLearning(course.id, l.id)}
                              className={`flex min-w-0 items-center gap-2 text-left text-sm transition ${
                                previewable
                                  ? "cursor-pointer text-slate-700 hover:text-indigo-700"
                                  : "cursor-default text-slate-500"
                              }`}
                            >
                              <PlayCircle className={`h-4 w-4 shrink-0 ${previewable ? "text-indigo-600" : "text-slate-300"}`} />
                              <span className="truncate">{l.title}</span>
                              {previewable && (
                                <span className="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
                                  {t("previewLesson")}
                                </span>
                              )}
                            </button>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{l.durationMinutes}m</span>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* about instructor */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">{t("aboutInstructor")}</h2>
            <div className="mt-3 flex gap-4 rounded-2xl border border-slate-200 p-5">
              <Avatar name={course.instructor.name} color={course.instructor.avatarColor} size="lg" />
              <div className="min-w-0 space-y-2">
                <p className="font-semibold text-slate-900">{course.instructor.name}</p>
                <p className="text-sm text-muted-foreground">{course.instructor.headline}</p>
                {course.instructor.bio && <p className="text-sm leading-relaxed text-slate-600">{course.instructor.bio}</p>}
                {course.instructor.country && (
                  <p className="text-xs text-muted-foreground">📍 {course.instructor.country}</p>
                )}
              </div>
            </div>
          </section>

          {/* reviews */}
          <CourseReviews courseId={course.id} />

          {/* hidden a11y duplicate of preview lesson titles */}
          <div className="sr-only" aria-label="preview lessons">
            {previewLessons.map((l) => (
              <span key={l.id}>{l.title}</span>
            ))}
          </div>
        </div>

        {/* sticky purchase card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <CourseCover gradient={course.coverGradient} category={course.category} className="h-44 w-full" iconSize={56} />
            <div className="p-5">
              {owned ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    {t("owned")}
                  </div>
                  <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => openLearning(course.id)}>
                    <PlayCircle className="h-4 w-4" />
                    {t("goToLessons")}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setView("student")}>
                    {t("goToCourse")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">${course.price.toFixed(2)}</p>
                  {user && user.role !== "STUDENT" ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {lang === "zh"
                        ? "当前账户为讲师/管理员，需以学生身份登录后购买。"
                        : "You're signed in as instructor/admin — sign in as a student to purchase."}
                    </p>
                  ) : null}
                  <Button
                    size="lg"
                    className="w-full bg-indigo-600 text-base hover:bg-indigo-700"
                    onClick={buy}
                    disabled={purchasing || (!!user && user.role !== "STUDENT")}
                  >
                    {purchasing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-5 w-5" />
                    )}
                    {purchasing ? t("purchasing") : t("buyNow")}
                  </Button>
                  {user?.role === "STUDENT" && (
                    <Button
                      variant="outline"
                      size="lg"
                      className={`w-full gap-2 ${wished ? "border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700" : ""}`}
                      onClick={toggleWishlist}
                    >
                      <Heart className={`h-4 w-4 ${wished ? "fill-rose-500 text-rose-500" : ""}`} />
                      {wished ? t("removeFromWishlist") : t("addToWishlist")}
                    </Button>
                  )}
                  <p className="text-center text-xs text-muted-foreground">{t("loginFooterNote")}</p>
                </div>
              )}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-900">{t("priceIncludes")}</p>
                <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <PlayCircle className="h-4 w-4 text-indigo-600" />
                    {course.lessonsCount} {t("totalLessons")} · {Math.round(course.durationMinutes / 60)} {t("hoursLabel")}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <InfinityIcon className="h-4 w-4 text-indigo-600" />
                    {t("lifetimeAccess")}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <BadgeCheck className="h-4 w-4 text-indigo-600" />
                    {t("certificate")}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    {t("refundPolicy")}
                  </li>
                </ul>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <p className="text-muted-foreground">{t("courseLevel")}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{trLevel(course.level, lang)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("courseLanguage")}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{course.language}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("lastUpdated")}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {new Date(course.updatedAt).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("colCategory")}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{course.category}</p>
                </div>
              </div>
              {/* demo status line */}
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">70 / 30 split</span>
                <StatusBadge status="COMPLETED" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
