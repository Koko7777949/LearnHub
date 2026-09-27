"use client";

import React, { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost } from "@/hooks/use-api";
import { DashboardShell } from "@/components/platform/app-shell";
import { Avatar, CourseCover, EmptyState, Rating, StatCard, StatusBadge, TxTypeBadge, LevelBadge } from "@/components/platform/ui-bits";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Award, BookOpen, CheckCircle2, Clock, Compass, GraduationCap, Heart, PlayCircle, Receipt, TrendingUp, Users } from "lucide-react";
import type { EnrolledCourse, StudentPurchase, WishlistEntry } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/format";

export function StudentDashboard() {
  const { t, lang } = useI18n();
  const { user, openCourse, openLearning, setView } = useApp();
  const [tab, setTab] = useState("all");

  const { data, loading } = useApi<{ enrollments: EnrolledCourse[]; purchases: StudentPurchase[] }>(
    user ? `/api/enrollments?studentId=${user.id}` : null,
  );
  const { data: wishData, loading: wishLoading, refetch: refetchWishlist } = useApi<{ wishlist: WishlistEntry[] }>(
    user ? `/api/wishlist?studentId=${user.id}` : null,
  );

  const enrollments = data?.enrollments || [];
  const purchases = data?.purchases || [];
  const wishlist = wishData?.wishlist || [];

  const filtered = useMemo(() => {
    if (tab === "inprogress") return enrollments.filter((e) => e.progress < 100);
    if (tab === "completed") return enrollments.filter((e) => e.progress >= 100);
    return enrollments;
  }, [enrollments, tab]);

  const stats = useMemo(() => {
    const completed = enrollments.filter((e) => e.progress >= 100).length;
    const inProgress = enrollments.filter((e) => e.progress < 100).length;
    const minutes = enrollments.reduce((s, e) => s + e.course.durationMinutes, 0);
    const avg = enrollments.length ? enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length : 0;
    const spent = purchases.filter((p) => p.status !== "REFUNDED").reduce((s, p) => s + p.grossAmount, 0);
    return { completed, inProgress, minutes, avg, spent };
  }, [enrollments, purchases]);

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

  if (!user) return null;

  return (
    <DashboardShell
      title={t("myLearningTitle")}
      subtitle={t("myLearningSubtitle")}
      actions={
        <Button variant="outline" className="gap-1.5" onClick={() => setView("marketplace")}>
          <Compass className="h-4 w-4" />
          {t("browseCourses")}
        </Button>
      }
    >
      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("enrolledCourses")} value={enrollments.length} icon={BookOpen} tone="info" />
        <StatCard label={t("inProgress")} value={stats.inProgress} icon={Clock} />
        <StatCard label={t("completedCourses")} value={stats.completed} icon={CheckCircle2} tone="positive" />
        <StatCard label={t("hoursLearned")} value={`${Math.round(stats.minutes / 60)}h`} icon={GraduationCap} />
      </div>

      {/* my courses with tabs */}
      <section className="mt-8" aria-label={t("continueLearning")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{t("continueLearning")}</h2>
          <span className="text-xs text-muted-foreground">
            {t("avgProgress")}: {stats.avg.toFixed(0)}%
          </span>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {t("tabAll")} ({enrollments.length})
            </TabsTrigger>
            <TabsTrigger value="inprogress" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t("tabInProgress")} ({stats.inProgress})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <Award className="h-3.5 w-3.5" />
              {t("tabCompleted")} ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              {t("tabWishlist")} ({wishlist.length})
            </TabsTrigger>
          </TabsList>

          {/* course tabs */}
          {(["all", "inprogress", "completed"] as const).map((key) => (
            <TabsContent key={key} value={key} className="mt-0">
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={t("noEnrollments")}
                  action={
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setView("marketplace")}>
                      {t("browseCourses")}
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((e) => (
                    <div
                      key={e.enrollmentId}
                      className="group flex cursor-pointer gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                      onClick={() => openLearning(e.course.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(ev) => ev.key === "Enter" && openLearning(e.course.id)}
                    >
                      <CourseCover
                        gradient={e.course.coverGradient}
                        category={e.course.category}
                        className="h-20 w-28 shrink-0 rounded-xl"
                        iconSize={26}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{e.course.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.course.instructor.name}</p>
                        <div className="mt-auto space-y-1.5 pt-2">
                          <Progress value={e.progress} className="h-1.5" aria-label={`${e.progress}%`} />
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={e.progress >= 100 ? "font-semibold text-emerald-600" : "text-muted-foreground"}>
                              {e.progress >= 100 ? (
                                <span className="inline-flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {t("completedCourses")}
                                </span>
                              ) : (
                                `${e.progress}%`
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1 font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
                              <PlayCircle className="h-3 w-3" />
                              {t("goToLessons")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}

          {/* wishlist tab */}
          <TabsContent value="wishlist" className="mt-0">
            {wishLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <EmptyState
                icon={Heart}
                title={t("wishlistEmpty")}
                action={
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setView("marketplace")}>
                    {t("browseCourses")}
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {wishlist.map((w) => (
                  <div
                    key={w.courseId}
                    className="group flex gap-4 rounded-2xl border border-rose-100 bg-white p-3.5 shadow-sm transition hover:border-rose-300 hover:shadow-md"
                  >
                    <div
                      className="relative cursor-pointer"
                      onClick={() => openCourse(w.courseId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(ev) => ev.key === "Enter" && openCourse(w.courseId)}
                    >
                      <CourseCover
                        gradient={w.course.coverGradient}
                        category={w.course.category}
                        className="h-20 w-28 shrink-0 rounded-xl"
                        iconSize={26}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p
                        className="line-clamp-2 cursor-pointer text-sm font-semibold leading-snug text-slate-900 hover:text-indigo-700"
                        onClick={() => openCourse(w.courseId)}
                      >
                        {w.course.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Rating value={w.course.rating} />
                        <LevelBadge level={w.course.level} />
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-sm font-bold text-slate-900">${w.course.price.toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            className="h-7 bg-indigo-600 px-3 text-xs hover:bg-indigo-700"
                            onClick={() => openCourse(w.courseId)}
                          >
                            {t("buyNow")}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => toggleWishlist(w.courseId)}
                            aria-label={t("removeFromWishlist")}
                          >
                            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {t("wishAddedOn")} {fmtDate(w.createdAt, lang)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* purchase history */}
      <section className="mt-8" aria-label={t("purchaseHistory")}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("purchaseHistory")}</h2>
            <p className="text-xs text-muted-foreground">{t("purchaseHistorySubtitle")}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">
              {t("totalSpent")}: {fmtMoney(stats.spent)}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-10">
              <EmptyState icon={Receipt} title={t("empty")} />
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white shadow-[0_1px_0_#e2e8f0]">
                  <TableRow>
                    <TableHead>{t("purchaseColDate")}</TableHead>
                    <TableHead>{t("purchaseColCourse")}</TableHead>
                    <TableHead className="text-right">{t("purchaseColAmount")}</TableHead>
                    <TableHead className="text-right">{t("purchaseColStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => openCourse(p.course.id)}
                    >
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(p.createdAt, lang)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <CourseCover gradient={p.course.coverGradient} category="" className="hidden h-8 w-12 shrink-0 rounded-md sm:block" iconSize={14} />
                          <span className="line-clamp-1 max-w-[280px] text-sm font-medium text-slate-800">{p.course.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-slate-900">
                        {fmtMoney(p.grossAmount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <TxTypeBadge type={p.type} />
                          <StatusBadge status={p.status} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <p className="mt-2 text-right text-xs text-muted-foreground">
          <Avatar name={user.name} color={user.avatarColor} size="sm" className="mr-1.5 inline-flex align-middle" />
          {user.email}
        </p>
      </section>
    </DashboardShell>
  );
}
