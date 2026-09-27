"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost, apiPatch } from "@/hooks/use-api";
import { EmptyState } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CircleCheck, CircleSlash, Copy, Plus, Ticket } from "lucide-react";
import type { Coupon, CourseWithInstructor, Role } from "@/lib/types";

/**
 * Shared coupon management UI.
 * - role="ADMIN": lists every coupon on the platform, can create storewide or course coupons.
 * - role="INSTRUCTOR": lists own coupons, can only create coupons scoped to own courses.
 */
export function CouponManager({ role }: { role: Extract<Role, "ADMIN" | "INSTRUCTOR"> }) {
  const { t, lang } = useI18n();
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // form state
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("20");
  const [maxUses, setMaxUses] = useState("100");
  const [courseId, setCourseId] = useState("ALL");
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");

  // coupons list (admin: all · instructor: own)
  const { data, loading, refetch } = useApi<{ coupons: Coupon[] }>(
    user ? `/api/coupons?role=${role}${role === "INSTRUCTOR" ? `&creatorId=${user.id}` : ""}` : null,
  );
  const coupons = data?.coupons || [];

  // course options for scoping (admin: all published · instructor: own)
  const { data: coursesData } = useApi<{ courses: CourseWithInstructor[] }>(
    user
      ? role === "ADMIN"
        ? "/api/courses?sort=popular"
        : `/api/courses?instructorId=${user.id}&sort=popular`
      : null,
  );

  async function createCoupon() {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(cleanCode)) {
      toast.error(t("errCouponCode"));
      return;
    }
    const off = Number(percentOff);
    if (!Number.isFinite(off) || off < 5 || off > 100) {
      toast.error(t("errCouponPercent"));
      return;
    }
    setCreating(true);
    const { ok } = await apiPost("/api/coupons", {
      code: cleanCode,
      percentOff: off,
      maxUses: Number(maxUses) || 100,
      courseId: role === "INSTRUCTOR" ? courseId : courseId === "ALL" ? null : courseId,
      expiresAt: expiresAt || null,
      description: description.trim() || null,
      createdBy: user.id,
    });
    setCreating(false);
    if (ok) {
      toast.success(t("couponCreatedToast").replace("{code}", cleanCode));
      setOpen(false);
      setCode("");
      setPercentOff("20");
      setMaxUses("100");
      setCourseId("ALL");
      setExpiresAt("");
      setDescription("");
      refetch();
    } else {
      toast.error(t("errCouponTaken"));
    }
  }

  async function toggleCoupon(c: Coupon) {
    if (!user) return;
    setTogglingId(c.id);
    const { ok } = await apiPatch(`/api/coupons/${c.id}`, { active: !c.active, requesterId: user.id });
    setTogglingId(null);
    if (ok) {
      toast.success(c.active ? t("couponDeactivatedToast") : t("couponActivatedToast"));
      refetch();
    } else {
      toast.error(t("error"));
    }
  }

  function copyCode(c: Coupon) {
    navigator.clipboard?.writeText(c.code).then(
      () => toast.success(t("copiedToast")),
      () => toast.error(t("error")),
    );
  }

  const now = Date.now();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("couponsTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("couponsSubtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              {t("createCoupon")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("createCoupon")}</DialogTitle>
              <DialogDescription>{t("createCouponDesc")}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="coupon-code">
                    {t("couponCodeField")}
                  </label>
                  <Input
                    id="coupon-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER25"
                    className="font-mono uppercase"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="coupon-percent">
                    {t("percentOffLabel")}
                  </label>
                  <div className="relative">
                    <Input
                      id="coupon-percent"
                      type="number"
                      min={5}
                      max={100}
                      value={percentOff}
                      onChange={(e) => setPercentOff(e.target.value)}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="coupon-uses">
                    {t("maxUsesLabel")}
                  </label>
                  <Input
                    id="coupon-uses"
                    type="number"
                    min={1}
                    max={100000}
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="coupon-expiry">
                    {t("expiresAtLabel")} <span className="font-normal text-muted-foreground">({t("optionalLabel")})</span>
                  </label>
                  <Input
                    id="coupon-expiry"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">{t("couponScopeLabel")}</label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {role === "ADMIN" && (
                      <SelectItem value="ALL">🌐 {t("couponScopeAll")}</SelectItem>
                    )}
                    {(coursesData?.courses || []).map((c) => (
                      <SelectItem key={c.id} value={c.id} className="max-w-[420px] truncate">
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {role === "ADMIN" ? t("couponScopeAdminHint") : t("couponScopeInstructorHint")}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="coupon-desc">
                  {t("couponDescLabel")} <span className="font-normal text-muted-foreground">({t("optionalLabel")})</span>
                </label>
                <Input
                  id="coupon-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("couponDescPlaceholder")}
                  maxLength={300}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={createCoupon} disabled={creating} className="bg-indigo-600 hover:bg-indigo-700">
                {creating ? t("publishingCourse") : t("createCoupon")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* table */}
      <div className="mt-4 overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !coupons.length ? (
          <div className="p-6">
            <EmptyState icon={Ticket} title={t("noCoupons")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("colCode")}</th>
                  <th className="px-4 py-3 font-medium">{t("colDiscount")}</th>
                  <th className="px-4 py-3 font-medium">{t("colScope")}</th>
                  {role === "ADMIN" && <th className="px-4 py-3 font-medium">{t("colCreator")}</th>}
                  <th className="px-4 py-3 font-medium">{t("colUses")}</th>
                  <th className="px-4 py-3 font-medium">{t("colExpires")}</th>
                  <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((c) => {
                  const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < now : false;
                  const exhausted = c.usedCount >= c.maxUses;
                  const live = c.active && !expired && !exhausted;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => copyCode(c)}
                          className="group inline-flex items-center gap-1.5 font-mono text-[13px] font-bold text-indigo-700 hover:text-indigo-900"
                          title={t("copy")}
                        >
                          {c.code}
                          <Copy className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">−{c.percentOff}%</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-xs text-slate-600">
                        {c.course ? c.course.title : t("couponScopeAll")}
                      </td>
                      {role === "ADMIN" && (
                        <td className="px-4 py-3 text-xs text-slate-600">{c.creator.name}</td>
                      )}
                      <td className="px-4 py-3 text-xs tabular-nums text-slate-600">
                        {c.usedCount.toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}/
                        {c.maxUses.toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            {t("expiredLabel")}
                          </span>
                        ) : exhausted ? (
                          <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                            {t("soldOutLabel")}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                              live
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-500"
                            }`}
                          >
                            {live ? t("activeLabel") : t("inactiveLabel")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          disabled={togglingId === c.id}
                          onClick={() => toggleCoupon(c)}
                        >
                          {togglingId === c.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                          ) : c.active ? (
                            <CircleSlash className="h-3 w-3" />
                          ) : (
                            <CircleCheck className="h-3 w-3" />
                          )}
                          {c.active ? t("deactivate") : t("activate")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
