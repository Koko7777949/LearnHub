"use client";

import React, { useState } from "react";
import { useI18n, trCategory, trLevel } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPatch } from "@/hooks/use-api";
import { DashboardShell } from "@/components/platform/app-shell";
import { Avatar, CourseCover, EmptyState, LevelBadge, Rating, StatCard, StatusBadge, TxTypeBadge } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouponManager } from "@/components/platform/coupon-manager";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, BookOpen, CheckCircle2, CircleDollarSign, Landmark, Loader2, Receipt, ShieldCheck, Users, XCircle } from "lucide-react";
import type { AdminStats, AdminUser, CourseWithInstructor, Payout } from "@/lib/types";
import { fmtDate, fmtMoney, fmtMoneyShort, fmtMonth, fmtNumber } from "@/lib/format";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#64748b"];

export function AdminPanel() {
  const { t, lang } = useI18n();
  const { user, adminTab, setAdminTab, openCourse } = useApp();
  const [rejectTarget, setRejectTarget] = useState<Payout | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("ALL");

  const { data: stats, loading: statsLoading } = useApi<AdminStats>(user ? "/api/admin/stats" : null);
  const { data: usersData, loading: usersLoading } = useApi<{ users: AdminUser[] }>(
    user && adminTab === "users" ? "/api/admin/users" : null,
  );
  const { data: payoutsData, loading: payoutsLoading, refetch: refetchPayouts } = useApi<{ payouts: Payout[] }>(
    user && (adminTab === "payouts" || adminTab === "overview") ? "/api/payouts" : null,
  );
  const { data: coursesData, loading: coursesLoading } = useApi<{ courses: CourseWithInstructor[] }>(
    user && adminTab === "courses" ? "/api/courses?sort=popular" : null,
  );

  const payouts = payoutsData?.payouts || [];
  const pendingQueue = payouts.filter((p) => p.status === "PENDING");
  const visiblePayouts = payouts.filter((p) => payoutStatusFilter === "ALL" || p.status === payoutStatusFilter);

  async function updatePayout(p: Payout, status: string, note?: string) {
    setBusyId(p.id);
    const { ok } = await apiPatch(`/api/payouts/${p.id}`, { status, note });
    setBusyId(null);
    if (ok) {
      toast.success(
        status === "APPROVED" ? t("payoutApprovedToast") : status === "PAID" ? t("payoutPaidToast") : t("payoutRejectedToast"),
      );
      refetchPayouts();
    } else {
      toast.error(t("error"));
    }
  }

  if (!user) return null;

  const chartData = (stats?.monthly || []).map((m) => ({
    name: fmtMonth(m.month, lang),
    gross: m.gross,
    net: m.net,
    fee: m.fee,
  }));
  const categoryData = (stats?.byCategory || []).map((c) => ({
    name: trCategory(c.category, lang),
    value: c.gross,
  }));

  return (
    <DashboardShell
      title={t("adminTitle")}
      subtitle={t("adminSubtitle")}
      actions={
        <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          {user.name}
        </div>
      }
    >
      <Tabs value={adminTab} onValueChange={setAdminTab}>
        <TabsList className="h-10 w-full max-w-xl justify-start bg-slate-100 p-1">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("adminTabOverview")}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("adminTabPayouts")}
            {pendingQueue.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                {pendingQueue.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("adminTabUsers")}
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("adminTabCourses")}
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("adminTabCoupons")}
          </TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW ============ */}
        {adminTab === "overview" && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard label={t("statGmv")} value={statsLoading ? "…" : fmtMoney(stats?.gmv || 0)} icon={CircleDollarSign} tone="info" sub={`${t("statLast30")}: ${fmtMoney(stats?.gmvLast30 || 0)}`} />
              <StatCard label={t("statPlatformRevenue")} value={statsLoading ? "…" : fmtMoney(stats?.platformRevenue || 0)} icon={Landmark} tone="warning" />
              <StatCard label={t("statInstructorPay")} value={statsLoading ? "…" : fmtMoney(stats?.instructorEarnings || 0)} icon={Banknote} tone="positive" />
              <StatCard label={t("statUserCount")} value={statsLoading ? "…" : fmtNumber(stats?.userCount || 0)} icon={Users} sub={`${fmtNumber(stats?.courseCount || 0)} ${t("heroStatCourses")} · ${fmtNumber(stats?.enrollmentCount || 0)} ${t("heroStatStudents")}`} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
              <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-1 text-sm font-bold text-slate-900">{t("revenueTrend")}</h3>
                <p className="mb-4 text-xs text-muted-foreground">{t("platformVsInstructor")}</p>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="adminFee" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => fmtMoneyShort(v)} />
                      <Tooltip
                        formatter={(v: number | string, name: string) => [
                          fmtMoney(Number(v)),
                          name === "gross" ? t("statGmv") : t("statPlatformRevenue"),
                        ]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="gross" stroke="#6366f1" strokeWidth={2.5} fill="url(#adminGross)" />
                      <Area type="monotone" dataKey="fee" stroke="#f59e0b" strokeWidth={2} fill="url(#adminFee)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full bg-indigo-500" /> {t("statGmv")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full bg-amber-500" /> {t("statPlatformRevenue")} (30%)
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-2 text-sm font-bold text-slate-900">{t("revenueByCategory")}</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number | string) => fmtMoney(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-1 space-y-1">
                  {categoryData.map((c, i) => (
                    <li key={c.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {c.name}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-800">{fmtMoney(c.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* recent transactions */}
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-4 py-3 sm:px-5">
                <h3 className="text-sm font-bold text-slate-900">{t("recentTransactions")}</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colDate")}</TableHead>
                      <TableHead>{t("colType")}</TableHead>
                      <TableHead className="min-w-[180px]">{t("colCourse")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("colInstructor")}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t("colStudent")}</TableHead>
                      <TableHead className="text-right">{t("colGross")}</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">{t("colFee")}</TableHead>
                      <TableHead className="text-right">{t("colNet")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statsLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 8 }).map((__, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : (stats?.recentTransactions || []).map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(tx.createdAt, lang)}</TableCell>
                            <TableCell>
                              <TxTypeBadge type={tx.type} />
                            </TableCell>
                            <TableCell className="max-w-[240px]">
                              <span className="line-clamp-1 text-sm font-medium text-slate-800" title={tx.course.title}>
                                {tx.course.title}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Avatar name={tx.instructor.name} color={tx.instructor.avatarColor} size="sm" />
                                <span className="text-sm text-slate-600">{tx.instructor.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden text-sm text-slate-600 lg:table-cell">{tx.student.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-right text-sm tabular-nums text-slate-800">{fmtMoney(tx.grossAmount)}</TableCell>
                            <TableCell className="hidden whitespace-nowrap text-right text-sm tabular-nums text-slate-500 sm:table-cell">{fmtMoney(tx.platformFee)}</TableCell>
                            <TableCell className="whitespace-nowrap text-right text-sm font-bold tabular-nums text-emerald-700">{fmtMoney(tx.netEarnings)}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* ============ PAYOUTS ============ */}
        {adminTab === "payouts" && (
          <div className="mt-5 space-y-4">
            {/* approval queue */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Landmark className="h-4 w-4 text-amber-600" />
                {t("payoutQueue")}
              </h3>
              {payoutsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : pendingQueue.length === 0 ? (
                <EmptyState icon={CheckCircle2} title={t("payoutQueueEmpty")} />
              ) : (
                <div className="space-y-2.5">
                  {pendingQueue.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
                      {p.instructor && <Avatar name={p.instructor.name} color={p.instructor.avatarColor} />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {p.instructor?.name} · {fmtMoney(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.instructor?.email} · {fmtDate(p.requestedAt, lang)} ·{" "}
                          {p.method === "PAYPAL" ? t("methodPaypal") : p.method === "BANK_TRANSFER" ? t("methodBank") : t("methodStripe")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={busyId === p.id}
                          onClick={() => {
                            setRejectTarget(p);
                            setRejectNote("");
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {t("reject")}
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                          disabled={busyId === p.id}
                          onClick={() => updatePayout(p, "APPROVED")}
                        >
                          {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {t("approve")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* all payouts */}
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
                <h3 className="text-sm font-bold text-slate-900">{t("ledgerTabPayouts")}</h3>
                <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                  <SelectTrigger size="sm" className="h-8 w-[130px] text-xs" aria-label={t("colStatus")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("all")}</SelectItem>
                    <SelectItem value="PENDING">{t("payoutPending")}</SelectItem>
                    <SelectItem value="APPROVED">{t("payoutApproved")}</SelectItem>
                    <SelectItem value="PAID">{t("payoutPaid")}</SelectItem>
                    <SelectItem value="REJECTED">{t("payoutRejected")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colInstructor")}</TableHead>
                      <TableHead>{t("colRequested")}</TableHead>
                      <TableHead className="text-right">{t("colAmount")}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t("colMethod")}</TableHead>
                      <TableHead>{t("colStatus")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("colProcessed")}</TableHead>
                      <TableHead className="text-right">{t("confirm")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      visiblePayouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              {p.instructor && <Avatar name={p.instructor.name} color={p.instructor.avatarColor} size="sm" />}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800">{p.instructor?.name}</p>
                                <p className="hidden text-xs text-muted-foreground sm:block">{p.instructor?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(p.requestedAt, lang)}</TableCell>
                          <TableCell
                            className={`whitespace-nowrap text-right text-sm font-bold tabular-nums ${
                              p.status === "REJECTED" ? "text-slate-400 line-through" : "text-slate-900"
                            }`}
                          >
                            {fmtMoney(p.amount)}
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap text-xs text-slate-600 sm:table-cell">
                            {p.method === "PAYPAL" ? t("methodPaypal") : p.method === "BANK_TRANSFER" ? t("methodBank") : t("methodStripe")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} />
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                            {p.processedAt ? fmtDate(p.processedAt, lang) : "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {p.status === "APPROVED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                                disabled={busyId === p.id}
                                onClick={() => updatePayout(p, "PAID")}
                              >
                                {busyId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Banknote className="h-3 w-3" />}
                                {t("markPaid")}
                              </Button>
                            ) : p.note ? (
                              <span className="line-clamp-1 max-w-[180px] text-xs text-slate-400" title={p.note}>
                                {p.note}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* ============ USERS ============ */}
        {adminTab === "users" && (
          <div className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colUser")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("colEmail")}</TableHead>
                    <TableHead>{t("colRole")}</TableHead>
                    <TableHead className="hidden text-right md:table-cell">{t("heroStatCourses")}</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">{t("heroStatStudents")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("colCountry")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("colJoined")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : (usersData?.users || []).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.name} color={u.avatarColor} size="sm" />
                              <span className="text-sm font-medium text-slate-800">{u.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{u.email}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                u.role === "ADMIN"
                                  ? "border-slate-300 bg-slate-100 text-slate-700"
                                  : u.role === "INSTRUCTOR"
                                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {u.role === "ADMIN" ? t("roleAdmin") : u.role === "INSTRUCTOR" ? t("roleInstructor") : t("roleStudent")}
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-right text-sm tabular-nums text-slate-600 md:table-cell">
                            {u.courseCount || "—"}
                          </TableCell>
                          <TableCell className="hidden text-right text-sm tabular-nums text-slate-600 lg:table-cell">
                            {u.enrollmentCount || "—"}
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{u.country || "—"}</TableCell>
                          <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                            {fmtDate(u.createdAt, lang)}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ============ COURSES ============ */}
        {adminTab === "courses" && (
          <div className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colCourse")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("colInstructor")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("colCategory")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("colLevel")}</TableHead>
                    <TableHead className="text-right">{t("colStudents")}</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">{t("colRating")}</TableHead>
                    <TableHead className="text-right">{t("colPrice")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coursesLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : (coursesData?.courses || []).map((c) => (
                        <TableRow key={c.id} className="cursor-pointer" onClick={() => openCourse(c.id)}>
                          <TableCell className="max-w-[300px]">
                            <div className="flex items-center gap-3">
                              <CourseCover gradient={c.coverGradient} category="" className="hidden h-9 w-13 shrink-0 rounded-lg sm:block" iconSize={16} />
                              <div className="min-w-0">
                                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{c.title}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">{c.instructor.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <Avatar name={c.instructor.name} color={c.instructor.avatarColor} size="sm" />
                              <span className="text-sm text-slate-600">{c.instructor.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{trCategory(c.category, lang)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <LevelBadge level={c.level} />
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-slate-700">{fmtNumber(c.studentsCount)}</TableCell>
                          <TableCell className="hidden text-right sm:table-cell">
                            <Rating value={c.rating} />
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold tabular-nums text-slate-900">${c.price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ============ COUPONS ============ */}
        {adminTab === "coupons" && (
          <div className="mt-5">
            <CouponManager role="ADMIN" />
          </div>
        )}
      </Tabs>

      {/* reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reject")}</DialogTitle>
            <DialogDescription>
              {rejectTarget?.instructor?.name} · {fmtMoney(rejectTarget?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Input
              placeholder={t("rejectReason")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              aria-label={t("rejectReason")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectNote.trim() || busyId === rejectTarget?.id}
              onClick={() => {
                if (rejectTarget) updatePayout(rejectTarget, "REJECTED", rejectNote.trim());
                setRejectTarget(null);
              }}
            >
              {busyId === rejectTarget?.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
