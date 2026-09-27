"use client";

import React, { useMemo, useState } from "react";
import { useI18n, trCategory } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost } from "@/hooks/use-api";
import { DashboardShell } from "@/components/platform/app-shell";
import { Avatar, CourseCover, EmptyState, StatCard, StatusBadge, TxTypeBadge, Delta } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  CircleDollarSign,
  Download,
  Info,
  Landmark,
  Loader2,
  Receipt,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LedgerSummary, LedgerTransaction, Payout } from "@/lib/types";
import { fmtDate, fmtMoney, fmtMoneyShort, fmtMonth, fmtNumber } from "@/lib/format";

type LedgerData = {
  summary: LedgerSummary;
  transactions: LedgerTransaction[];
  instructor: { id: string; name: string };
};

const PERIODS = [
  { value: "all", key: "rangeAll" },
  { value: "30", key: "range30" },
  { value: "90", key: "range90" },
  { value: "180", key: "range180" },
] as const;

export function RevenueLedger() {
  const { t, lang } = useI18n();
  const { user, ledgerTab, setLedgerTab } = useApp();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [period, setPeriod] = useState("all");
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("PAYPAL");
  const [requesting, setRequesting] = useState(false);
  const [payoutVersion, setPayoutVersion] = useState(0);

  const { data, loading, refetch } = useApi<LedgerData>(
    user ? `/api/ledger?instructorId=${user.id}` : null,
  );
  const summary = data?.summary;
  const transactions = data?.transactions || [];

  /* ---------- derived filtered transactions ---------- */
  const filtered = useMemo(() => {
    const cutoff =
      period === "all"
        ? 0
        : Date.now() - Number(period) * 24 * 3600 * 1000;
    return transactions.filter(
      (tx) =>
        (typeFilter === "ALL" || tx.type === typeFilter) &&
        (courseFilter === "ALL" || tx.course.id === courseFilter) &&
        new Date(tx.createdAt).getTime() >= cutoff,
    );
  }, [transactions, typeFilter, courseFilter, period]);

  /* running balance computed chronologically */
  const rowsWithBalance = useMemo(() => {
    const asc = [...filtered].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let bal = 0;
    const map = new Map<string, number>();
    for (const tx of asc) {
      bal += tx.netEarnings;
      map.set(tx.id, Math.round(bal * 100) / 100);
    }
    return filtered.map((tx) => ({ ...tx, balance: map.get(tx.id) ?? 0 }));
  }, [filtered]);

  const filteredTotals = useMemo(() => {
    const gross = filtered.reduce((s, tx) => s + tx.grossAmount, 0);
    const fee = filtered.reduce((s, tx) => s + tx.platformFee, 0);
    const net = filtered.reduce((s, tx) => s + tx.netEarnings, 0);
    return { gross, fee, net };
  }, [filtered]);

  const chartData = (summary?.monthly || []).map((m) => ({
    name: fmtMonth(m.month, lang),
    net: m.net,
    gross: m.gross,
  }));

  const splitData = [
    { name: t("splitYou"), value: Math.max(summary?.lifetimeNet || 0, 0), color: "#6366f1" },
    { name: t("splitPlatform"), value: Math.max(summary?.platformFees || 0, 0), color: "#cbd5e1" },
  ];

  const byCourseChart = (summary?.byCourse || []).slice(0, 8).map((c) => ({
    name: c.title.length > 26 ? c.title.slice(0, 26) + "…" : c.title,
    net: c.net,
    gradient: c.coverGradient,
  }));

  const monthlyDelta = useMemo(() => {
    const m = summary?.monthly || [];
    if (m.length < 2) return 0;
    const prev = m[m.length - 2].net;
    const last = m[m.length - 1].net;
    if (prev === 0) return 100;
    return ((last - prev) / Math.abs(prev)) * 100;
  }, [summary]);

  async function requestPayout() {
    if (!user) return;
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) {
      toast.error(t("payoutInvalid"));
      return;
    }
    setRequesting(true);
    const { ok, data: res } = await apiPost<{ payout: Payout }>("/api/payouts", {
      instructorId: user.id,
      amount: amt,
      method: payoutMethod,
    });
    setRequesting(false);
    if (ok) {
      toast.success(t("payoutRequested"));
      setPayoutOpen(false);
      setPayoutAmount("");
      refetch();
      setPayoutVersion((v) => v + 1);
    } else {
      const err = (res as { error?: string; available?: number } | null)?.error;
      toast.error(err === "INSUFFICIENT_BALANCE" ? t("payoutTooMuch") : t("error"));
    }
  }

  if (!user) return null;

  return (
    <DashboardShell
      title={t("ledgerTitle")}
      subtitle={t("ledgerSubtitle")}
      actions={
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t("retry")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/api/export?instructorId=${user.id}`, "_blank")}>
            <Download className="h-3.5 w-3.5" />
            {t("exportCsv")}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              setPayoutVersion((v) => v + 1);
              setPayoutOpen(true);
            }}
          >
            <Banknote className="h-3.5 w-3.5" />
            {t("requestPayout")}
          </Button>
        </>
      }
    >
      <Tabs value={ledgerTab} onValueChange={setLedgerTab}>
        <TabsList className="h-10 w-full max-w-md justify-start bg-slate-100 p-1">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("ledgerTabOverview")}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("ledgerTabTransactions")}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("ledgerTabPayouts")}
          </TabsTrigger>
          <TabsTrigger value="bycourse" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t("ledgerTabByCourse")}
          </TabsTrigger>
        </TabsList>

        {/* ================= OVERVIEW ================= */}
        {ledgerTab === "overview" && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              <StatCard
                label={t("statLifetime")}
                value={loading ? "…" : fmtMoney(summary?.lifetimeNet || 0)}
                icon={CircleDollarSign}
                tone="info"
                sub={`${fmtNumber(summary?.salesCount || 0)} ${t("statSaleCount")}`}
              />
              <StatCard
                label={t("statAvailable")}
                value={loading ? "…" : fmtMoney(summary?.availableBalance || 0)}
                icon={Wallet}
                tone="positive"
                sub={
                  <button className="underline underline-offset-2 hover:text-emerald-700" onClick={() => setPayoutOpen(true)}>
                    {t("requestPayout")} →
                  </button>
                }
              />
              <StatCard
                label={t("statPendingPayout")}
                value={loading ? "…" : fmtMoney(summary?.pendingPayouts || 0)}
                icon={Landmark}
                tone="warning"
              />
              <StatCard
                label={t("statLast30")}
                value={loading ? "…" : fmtMoney(summary?.netLast30 || 0)}
                icon={TrendingUp}
                sub={<Delta value={monthlyDelta} />}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard label={t("statGrossSales")} value={loading ? "…" : fmtMoney(summary?.grossSales || 0)} icon={Receipt} />
              <StatCard label={t("statPlatformFee")} value={loading ? "…" : fmtMoney(summary?.platformFees || 0)} icon={Landmark} />
              <StatCard label={t("statRefunds")} value={loading ? "…" : fmtMoney(summary?.totalRefunds || 0)} icon={Receipt} tone="warning" />
              <StatCard label={t("statSaleCount")} value={loading ? "…" : fmtNumber(summary?.salesCount || 0)} icon={CircleDollarSign} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
              {/* monthly chart */}
              <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">{t("revenueTrend")}</h3>
                  <p className="text-xs text-muted-foreground">{t("revenueTrendHint")}</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ledNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ledGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
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
                        formatter={(v: number | string, name: string) => [fmtMoney(Number(v)), name === "net" ? t("colNet") : t("colGross")]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="gross" stroke="#a855f7" strokeWidth={1.5} fill="url(#ledGross)" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2.5} fill="url(#ledNet)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full bg-indigo-500" /> {t("colNet")} (70%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full bg-purple-400" /> {t("colGross")}
                  </span>
                </div>
              </div>

              {/* split donut + explainer */}
              <div className="space-y-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="mb-2 text-sm font-bold text-slate-900">{t("revenueSplit")}</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={splitData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          <Cell fill="#6366f1" />
                          <Cell fill="#cbd5e1" />
                        </Pie>
                        <Tooltip
                          formatter={(v: number | string) => fmtMoney(Number(v))}
                          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        {t("splitYou")}
                      </span>
                      <span className="font-bold tabular-nums text-indigo-600">{fmtMoney(summary?.lifetimeNet || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        {t("splitPlatform")}
                      </span>
                      <span className="font-bold tabular-nums text-slate-500">{fmtMoney(summary?.platformFees || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-indigo-900">
                    <Info className="h-4 w-4" />
                    {t("ledgerExplainer")}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-indigo-800/80">{t("ledgerExplainerBody")}</p>
                </div>
              </div>
            </div>

            {/* recent activity */}
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
                <h3 className="text-sm font-bold text-slate-900">{t("recentActivity")}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-indigo-600"
                  onClick={() => setLedgerTab("transactions")}
                >
                  {t("viewAll")} →
                </Button>
              </div>
              <ul className="divide-y">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <li key={i} className="px-4 py-3 sm:px-5">
                        <Skeleton className="h-9" />
                      </li>
                    ))
                  : transactions.slice(0, 6).map((tx) => (
                      <li key={tx.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                        <Avatar name={tx.student.name} color={tx.student.avatarColor} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            <span className="font-medium text-slate-900">{tx.student.name}</span>
                            <span className="text-muted-foreground">
                              {" · "}
                              {tx.type === "SALE" ? t("txSaleDesc") : t("txRefundDesc")} ·{" "}
                            </span>
                            <span className="text-slate-700">{tx.course.title}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{fmtDate(tx.createdAt, lang)}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold tabular-nums ${
                              tx.netEarnings < 0 ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {fmtMoney(tx.netEarnings, { sign: true })}
                          </p>
                          <TxTypeBadge type={tx.type} />
                        </div>
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        )}

        {/* ================= TRANSACTIONS ================= */}
        {ledgerTab === "transactions" && (
          <div className="mt-5 space-y-4">
            {/* filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger size="sm" className="h-9 w-[130px]" aria-label={t("filterType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("filterType")}: {t("all")}</SelectItem>
                  <SelectItem value="SALE">{t("typeSale")}</SelectItem>
                  <SelectItem value="REFUND">{t("typeRefund")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger size="sm" className="h-9 w-[220px]" aria-label={t("filterCourse")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="ALL">{t("filterCourse")}: {t("all")}</SelectItem>
                  {(summary?.byCourse || []).map((c) => (
                    <SelectItem key={c.courseId} value={c.courseId}>
                      {c.title.length > 34 ? c.title.slice(0, 34) + "…" : c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger size="sm" className="h-9 w-[150px]" aria-label={t("filterRange")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {t(p.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-3 rounded-lg border bg-white px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">
                  {t("colGross")}: <b className="tabular-nums text-slate-800">{fmtMoney(filteredTotals.gross)}</b>
                </span>
                <span className="text-muted-foreground">
                  {t("colFee")}: <b className="tabular-nums text-slate-800">{fmtMoney(filteredTotals.fee)}</b>
                </span>
                <span className="text-muted-foreground">
                  {t("colNet")}:{" "}
                  <b className={`tabular-nums ${filteredTotals.net < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {fmtMoney(filteredTotals.net)}
                  </b>
                </span>
              </div>
            </div>

            {/* table */}
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : rowsWithBalance.length === 0 ? (
                <div className="p-10">
                  <EmptyState icon={Receipt} title={t("noTransactions")} />
                </div>
              ) : (
                <div className="max-h-[640px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_#e2e8f0]">
                      <TableRow>
                        <TableHead>{t("colDate")}</TableHead>
                        <TableHead>{t("colType")}</TableHead>
                        <TableHead className="min-w-[200px]">{t("colCourse")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("colStudent")}</TableHead>
                        <TableHead className="text-right">{t("colGross")}</TableHead>
                        <TableHead className="hidden text-right sm:table-cell">{t("colFee")}</TableHead>
                        <TableHead className="text-right">{t("colNet")}</TableHead>
                        <TableHead className="hidden text-right lg:table-cell">{t("colBalance")}</TableHead>
                        <TableHead className="hidden text-right lg:table-cell">{t("colStatus")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rowsWithBalance.map((tx) => (
                        <TableRow key={tx.id} className="group">
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {fmtDate(tx.createdAt, lang)}
                          </TableCell>
                          <TableCell>
                            <TxTypeBadge type={tx.type} />
                          </TableCell>
                          <TableCell className="max-w-[260px]">
                            <span className="line-clamp-1 text-sm font-medium text-slate-800" title={tx.course.title}>
                              {tx.course.title}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Avatar name={tx.student.name} color={tx.student.avatarColor} size="sm" />
                              <span className="text-sm text-slate-600">{tx.student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={`whitespace-nowrap text-right text-sm tabular-nums ${
                              tx.grossAmount < 0 ? "text-red-600" : "text-slate-800"
                            }`}
                          >
                            {fmtMoney(tx.grossAmount, { sign: tx.grossAmount < 0 })}
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap text-right text-sm tabular-nums text-slate-500 sm:table-cell">
                            {fmtMoney(tx.platformFee, { sign: tx.platformFee < 0 })}
                          </TableCell>
                          <TableCell
                            className={`whitespace-nowrap text-right text-sm font-bold tabular-nums ${
                              tx.netEarnings < 0 ? "text-red-600" : "text-emerald-700"
                            }`}
                          >
                            {fmtMoney(tx.netEarnings, { sign: tx.netEarnings < 0 })}
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap text-right text-xs tabular-nums text-slate-500 lg:table-cell">
                            {fmtMoney(tx.balance)}
                          </TableCell>
                          <TableCell className="hidden text-right lg:table-cell">
                            <StatusBadge status={tx.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <Info className="mr-1 inline h-3 w-3" />
              {t("runningBalanceNote")}
            </p>
          </div>
        )}

        {/* ================= PAYOUTS ================= */}
        {ledgerTab === "payouts" && (
          <PayoutsSection key={payoutVersion} onRefetch={refetch} onOpenRequest={() => setPayoutOpen(true)} />
        )}

        {/* ================= BY COURSE ================= */}
        {ledgerTab === "bycourse" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">{t("byCourseTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("byCourseHint")}</p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCourseChart} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => fmtMoneyShort(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                      width={190}
                    />
                    <Tooltip
                      formatter={(v: number | string) => [fmtMoney(Number(v)), t("colNet")]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      cursor={{ fill: "#f1f5f9" }}
                    />
                    <Bar dataKey="net" radius={[0, 6, 6, 0]} maxBarSize={26}>
                      {byCourseChart.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? "#6366f1" : "#8b5cf6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colCourse")}</TableHead>
                    <TableHead className="text-right">{t("colSales")}</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">{t("colRefunds")}</TableHead>
                    <TableHead className="hidden text-right md:table-cell">{t("colGross")}</TableHead>
                    <TableHead className="text-right">{t("colNet")}</TableHead>
                    <TableHead className="hidden w-[160px] sm:table-cell">{t("colShare")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.byCourse || []).map((c) => {
                    const maxNet = summary?.byCourse[0]?.net || 1;
                    const share = maxNet > 0 ? (c.net / maxNet) * 100 : 0;
                    return (
                      <TableRow key={c.courseId}>
                        <TableCell className="max-w-[300px]">
                          <div className="flex items-center gap-3">
                            <CourseCover gradient={c.coverGradient} category="" className="hidden h-9 w-13 shrink-0 rounded-lg sm:block" iconSize={16} />
                            <span className="line-clamp-1 text-sm font-medium text-slate-800" title={c.title}>
                              {c.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-slate-700">{c.sales}</TableCell>
                        <TableCell className="hidden text-right text-sm tabular-nums text-red-600 sm:table-cell">
                          {c.refunds > 0 ? c.refunds : "—"}
                        </TableCell>
                        <TableCell className="hidden text-right text-sm tabular-nums text-slate-600 md:table-cell">
                          {fmtMoney(c.gross)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold tabular-nums text-emerald-700">{fmtMoney(c.net)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                              style={{ width: `${Math.max(share, 2)}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Tabs>

      {/* ============ request payout dialog ============ */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("requestPayout")}</DialogTitle>
            <DialogDescription>{t("ledgerExplainerBody")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-medium text-emerald-800">{t("availableNow")}</span>
              <span className="text-lg font-bold tabular-nums text-emerald-700">
                {fmtMoney(summary?.availableBalance || 0)}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-amount">{t("payoutAmount")}</Label>
              <Input
                id="payout-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("payoutMethod")}</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger aria-label={t("payoutMethod")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYPAL">{t("methodPaypal")}</SelectItem>
                  <SelectItem value="BANK_TRANSFER">{t("methodBank")}</SelectItem>
                  <SelectItem value="STRIPE">{t("methodStripe")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 100].map((pct) => (
                <Button
                  key={pct}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPayoutAmount(
                      String(Math.floor(((summary?.availableBalance || 0) * pct) / 100) * 100 / 100),
                    )
                  }
                >
                  {pct}%
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>
              {t("cancel")}
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={requestPayout} disabled={requesting}>
              {requesting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

/* ================= PAYOUTS SECTION ================= */
function PayoutsSection({ onRefetch, onOpenRequest }: { onRefetch: () => void; onOpenRequest: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useApp();
  const { data, loading } = useApi<{ payouts: Payout[] }>(user ? `/api/payouts?instructorId=${user.id}` : null);
  const payouts = data?.payouts || [];

  const totals = useMemo(() => {
    const paid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
    const pending = payouts.filter((p) => ["PENDING", "APPROVED"].includes(p.status)).reduce((s, p) => s + p.amount, 0);
    const rejected = payouts.filter((p) => p.status === "REJECTED").reduce((s, p) => s + p.amount, 0);
    return { paid, pending, rejected };
  }, [payouts]);

  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label={t("payoutPaid")} value={fmtMoney(totals.paid)} icon={Banknote} tone="positive" />
        <StatCard label={t("statPendingPayout")} value={fmtMoney(totals.pending)} icon={Landmark} tone="warning" />
        <StatCard label={t("payoutRejected")} value={fmtMoney(totals.rejected)} icon={Receipt} />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold text-slate-900">{t("ledgerTabPayouts")}</h3>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onOpenRequest}>
            <Banknote className="h-3.5 w-3.5" />
            {t("requestPayout")}
          </Button>
        </div>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-10">
            <EmptyState icon={Banknote} title={t("noPayouts")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colRequested")}</TableHead>
                  <TableHead className="text-right">{t("colAmount")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("colMethod")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("colProcessed")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("colNote")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
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
                    <TableCell className="hidden max-w-[260px] lg:table-cell">
                      {p.note ? <span className="line-clamp-2 text-xs text-slate-500">{p.note}</span> : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
