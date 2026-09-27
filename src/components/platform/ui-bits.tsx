"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { avatarGradient, initials } from "@/lib/format";
import { useI18n, trLevel } from "@/lib/i18n";
import { BookOpen, Clock, Star, TrendingUp } from "lucide-react";

/* ---------- gradient avatar ---------- */
export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-base",
  };
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm",
        avatarGradient(color),
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

/* ---------- course cover ---------- */
export function CourseCover({
  gradient,
  category,
  className,
  iconSize = 48,
}: {
  gradient: string;
  category: string;
  className?: string;
  iconSize?: number;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", gradient, className)}>
      <div className="absolute inset-0 opacity-[0.15]" aria-hidden>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`grid-${gradient.replace(/[^a-z0-9]/gi, "")}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0v24" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${gradient.replace(/[^a-z0-9]/gi, "")})`} />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <BookOpen style={{ width: iconSize, height: iconSize }} className="text-white/70" />
      </div>
      <span className="absolute bottom-2 left-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
        {category}
      </span>
    </div>
  );
}

/* ---------- stat card ---------- */
export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  sub?: React.ReactNode;
  tone?: "default" | "positive" | "warning" | "info";
  className?: string;
}) {
  const tones = {
    default: "text-slate-900",
    positive: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-indigo-600",
  };
  const iconTones = {
    default: "bg-slate-100 text-slate-600",
    positive: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-[13px]">{label}</p>
        <div className={cn("rounded-lg p-1.5", iconTones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn("mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl", tones[tone])}>{value}</p>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

/* ---------- status / type badges ---------- */
export function TxTypeBadge({ type }: { type: string }) {
  const { t } = useI18n();
  const isRefund = type === "REFUND";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        isRefund ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600",
      )}
    >
      {isRefund ? t("typeRefund") : t("typeSale")}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: t("txCompleted"), cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    REFUNDED: { label: t("refundRequested"), cls: "bg-red-50 text-red-700 border-red-200" },
    PENDING: { label: t("payoutPending"), cls: "bg-amber-50 text-amber-700 border-amber-200" },
    APPROVED: { label: t("payoutApproved"), cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    PAID: { label: t("payoutPaid"), cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    REJECTED: { label: t("payoutRejected"), cls: "bg-red-50 text-red-700 border-red-200" },
    PUBLISHED: { label: t("published"), cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    DRAFT: { label: t("draft"), cls: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const cfg = map[status] || { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold", cfg.cls)}>{cfg.label}</span>;
}

export function LevelBadge({ level }: { level: string }) {
  const { lang } = useI18n();
  return (
    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {trLevel(level, lang)}
    </span>
  );
}

/* ---------- rating ---------- */
export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  const { lang } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px]", className)}>
      <span className="font-semibold text-amber-700">{value.toFixed(1)}</span>
      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
      {typeof count === "number" && (
        <span className="text-muted-foreground">
          ({count.toLocaleString(lang === "zh" ? "zh-CN" : "en-US")})
        </span>
      )}
    </span>
  );
}

/* ---------- course meta (lessons / duration) ---------- */
export function CourseMeta({ lessons, minutes }: { lessons: number; minutes: number }) {
  const { t, lang } = useI18n();
  return (
    <span className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <BookOpen className="h-3.5 w-3.5" />
        {lessons} {t("totalLessons")}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        {Math.round(minutes / 60)} {t("hoursLabel")}
      </span>
    </span>
  );
}

/* ---------- delta indicator ---------- */
export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        up ? "text-emerald-600" : "text-red-600",
      )}
    >
      <TrendingUp className={cn("h-3.5 w-3.5", !up && "rotate-180")} />
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

/* ---------- empty state ---------- */
export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

/* ---------- skeleton ---------- */
export function SkeletonRow({ cells = 5 }: { cells?: number }) {
  return (
    <div className="flex items-center gap-4 border-b px-4 py-3.5">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="h-4 flex-1 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
