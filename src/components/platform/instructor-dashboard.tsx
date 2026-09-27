"use client";

import React from "react";
import { useI18n, trCategory, trLevel } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi } from "@/hooks/use-api";
import { DashboardShell } from "@/components/platform/app-shell";
import { CourseCover, EmptyState, LevelBadge, Rating, StatCard, StatusBadge } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, LineChart, Star, Users, Wallet, LayoutDashboard } from "lucide-react";
import type { CourseWithInstructor } from "@/lib/types";
import type { LedgerSummary } from "@/lib/types";
import { fmtMoney, fmtMoneyShort, fmtMonth, fmtNumber } from "@/lib/format";

export function InstructorDashboard() {
  const { t, lang } = useI18n();
  const { user, openCourse, setView, setLedgerTab } = useApp();

  const { data: coursesData, loading: coursesLoading } = useApi<{ courses: CourseWithInstructor[] }>(
    user ? `/api/courses?instructorId=${user.id}&sort=popular` : null,
  );
  const { data: ledgerData, loading: ledgerLoading } = useApi<{ summary: LedgerSummary }>(
    user ? `/api/ledger?instructorId=${user.id}` : null,
  );

  const courses = coursesData?.courses || [];
  const summary = ledgerData?.summary;

  const netByCourse = new Map((summary?.byCourse || []).map((c) => [c.courseId, c]));
  const totalStudents = courses.reduce((s, c) => s + c.studentsCount, 0);
  const avgRating = courses.length ? courses.reduce((s, c) => s + c.rating, 0) / courses.length : 0;

  const chartData = (summary?.monthly || []).map((m) => ({
    name: fmtMonth(m.month, lang),
    net: m.net,
  }));

  if (!user) return null;

  return (
    <DashboardShell
      title={t("instructorTitle")}
      subtitle={t("instructorSubtitle")}
      actions={
        <Button
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            setLedgerTab("overview");
            setView("ledger");
          }}
        >
          <LineChart className="h-4 w-4" />
          {t("openLedger")}
        </Button>
      }
    >
      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("statTotalStudents")} value={fmtNumber(totalStudents)} icon={Users} tone="info" />
        <StatCard
          label={t("statTotalRevenue")}
          value={ledgerLoading ? "…" : fmtMoney(summary?.lifetimeNet || 0)}
          icon={Wallet}
          tone="positive"
          sub={`${t("statAvailable")}: ${fmtMoney(summary?.availableBalance || 0)}`}
        />
        <StatCard label={t("statAvgRating")} value={avgRating.toFixed(1)} icon={Star} tone="warning" />
        <StatCard label={t("statCourses")} value={courses.length} icon={BookOpen} />
      </div>

      {/* earnings chart + breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t("revenueTrend")}</h3>
              <p className="text-xs text-muted-foreground">{t("revenueTrendHint")}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-indigo-600"
              onClick={() => {
                setLedgerTab("transactions");
                setView("ledger");
              }}
            >
              {t("viewAll")} →
            </Button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="instNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v: number) => fmtMoneyShort(v)}
                />
                <Tooltip
                  formatter={(v: number | string) => [fmtMoney(Number(v)), t("colNet")]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2.5} fill="url(#instNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-900">{t("revenueSplit")}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{t("splitYou")}</span>
                <span className="font-bold tabular-nums text-indigo-600">{fmtMoney(summary?.lifetimeNet || 0)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: "70%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{t("splitPlatform")}</span>
                <span className="font-bold tabular-nums text-slate-500">{fmtMoney(summary?.platformFees || 0)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-300" style={{ width: "30%" }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center">
              <div>
                <p className="text-lg font-bold tabular-nums text-slate-900">{fmtNumber(summary?.salesCount || 0)}</p>
                <p className="text-[10px] text-muted-foreground">{t("statSaleCount")}</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-red-600">{fmtMoney(summary?.totalRefunds || 0)}</p>
                <p className="text-[10px] text-muted-foreground">{t("statRefunds")}</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-emerald-600">{fmtMoney(summary?.availableBalance || 0)}</p>
                <p className="text-[10px] text-muted-foreground">{t("statAvailable")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* my courses */}
      <section className="mt-6" aria-label={t("myCourses")}>
        <h2 className="mb-3 text-base font-bold text-slate-900">{t("myCourses")}</h2>
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {coursesLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-10">
              <EmptyState icon={LayoutDashboard} title={t("noCoursesYet")} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colCourse")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("colLevel")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("colCategory")}</TableHead>
                    <TableHead className="text-right">{t("colStudents")}</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">{t("colRating")}</TableHead>
                    <TableHead className="text-right">{t("colRevenue")}</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">{t("colPrice")}</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">{t("colStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c) => {
                    const bc = netByCourse.get(c.id);
                    return (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => openCourse(c.id)}>
                        <TableCell className="max-w-[320px]">
                          <div className="flex items-center gap-3">
                            <CourseCover gradient={c.coverGradient} category="" className="hidden h-10 w-14 shrink-0 rounded-lg sm:block" iconSize={18} />
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-semibold text-slate-900">{c.title}</p>
                              <p className="mt-0.5 sm:hidden">{trLevel(c.level, lang)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <LevelBadge level={c.level} />
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{trCategory(c.category, lang)}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-slate-700">
                          {fmtNumber(c.studentsCount)}
                        </TableCell>
                        <TableCell className="hidden text-right sm:table-cell">
                          <Rating value={c.rating} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold tabular-nums text-emerald-700">
                          {fmtMoney(bc?.net || 0)}
                        </TableCell>
                        <TableCell className="hidden text-right text-sm tabular-nums text-slate-600 lg:table-cell">
                          ${c.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="hidden text-right lg:table-cell">
                          <StatusBadge status={c.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
