"use client";

import React, { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost } from "@/hooks/use-api";
import { TopHeader, SiteFooter } from "@/components/platform/app-shell";
import { CourseCover, EmptyState, LevelBadge } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  CircleCheck,
  CreditCard,
  Ticket,
  Loader2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { CourseWithInstructor, CouponValidation, CouponFailReason, CheckoutResult, StripeConfig, StripeCheckoutResponse } from "@/lib/types";

export function CartView() {
  const { t, lang } = useI18n();
  const { cart, removeFromCart, clearCart, user, setView, openCourse } = useApp();
  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<CouponValidation | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  // Stripe activation probe (falls back to demo rail when no STRIPE_SECRET_KEY)
  const { data: stripeCfg } = useApi<StripeConfig>("/api/stripe/config");
  const stripeEnabled = !!stripeCfg?.enabled;

  const cartIds = useMemo(() => cart.map((c) => c.courseId), [cart]);

  // fetch the courses currently in cart
  const { data, loading } = useApi<{ courses: CourseWithInstructor[] }>(
    cartIds.length ? `/api/courses?ids=${cartIds.join(",")}&sort=popular` : null,
  );
  const courses = useMemo(
    () => (data?.courses || []).filter((c) => cartIds.includes(c.id)),
    [data, cartIds],
  );

  // ownership check for students
  const { data: myData } = useApi<{ purchases: { course: { id: string } }[] }>(
    user?.role === "STUDENT" ? `/api/enrollments?studentId=${user.id}` : null,
  );
  const ownedIds = useMemo(() => new Set((myData?.purchases || []).map((p) => p.course.id)), [myData]);

  // totals (client-side mirror of the server logic)
  const totals = useMemo(() => {
    const subtotal = courses.reduce((s, c) => s + c.price, 0);
    let discount = 0;
    if (applied?.valid && applied.items) {
      for (const it of applied.items) {
        const c = courses.find((x) => x.id === it.courseId);
        if (c && c.price === it.originalPrice) discount += it.discountAmount;
      }
    }
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round((subtotal - discount) * 100) / 100,
    };
  }, [courses, applied]);

  const checkoutable = courses.filter((c) => !ownedIds.has(c.id));

  /* ---- coupon handling ---- */
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code || !cartIds.length) return;
    setCheckingCoupon(true);
    const { data: resp } = await apiPost<CouponValidation>("/api/coupons/validate", {
      code,
      courseIds: cartIds,
    });
    setCheckingCoupon(false);
    if (resp?.valid && resp.coupon) {
      setApplied(resp);
      toast.success(t("couponAppliedToast").replace("{code}", resp.coupon.code));
    } else {
      setApplied(null);
      const reasonMap: Record<CouponFailReason, string> = {
        NOT_FOUND: t("couponInvalid"),
        INACTIVE: t("couponInactive"),
        EXPIRED: t("couponExpired"),
        MAX_USES: t("couponMaxUses"),
        NOT_APPLICABLE: t("couponNotApplicable"),
      };
      toast.error(resp?.reason ? reasonMap[resp.reason] || t("couponInvalid") : t("couponInvalid"));
    }
  }

  function clearCoupon() {
    setApplied(null);
    setCouponInput("");
  }

  /* ---- checkout ---- */
  async function checkout() {
    if (!user || user.role !== "STUDENT") {
      setView("login");
      return;
    }
    if (!checkoutable.length) return;
    setPlacing(true);

    if (stripeEnabled && totals.total > 0) {
      // real Stripe Checkout — server prices the cart, Stripe hosts the payment page
      const { ok, data: resp } = await apiPost<StripeCheckoutResponse>("/api/stripe/checkout", {
        studentId: user.id,
        courseIds: checkoutable.map((c) => c.id),
        couponCode: applied?.valid ? applied.coupon?.code : undefined,
      });
      if (ok && resp?.url) {
        window.location.href = resp.url; // redirect to Stripe hosted checkout
        return;
      }
      if (ok && resp?.free) {
        // 100%-off coupon → enrolled server-side with no charge
        setPlacing(false);
        setResult({
          enrolled: resp.enrolled ?? [],
          skippedOwned: resp.skippedOwned ?? [],
          totals: resp.totals ?? { subtotal: 0, discount: 0, total: 0 },
          coupon: resp.coupon ?? null,
        });
        clearCart();
        clearCoupon();
        toast.success(t("checkoutSuccessToast"));
        return;
      }
      setPlacing(false);
      toast.error(t("error"));
      return;
    }

    // demo rail — instant enrollment, no real payment
    const { ok, data: resp } = await apiPost<CheckoutResult>("/api/cart/checkout", {
      studentId: user.id,
      courseIds: checkoutable.map((c) => c.id),
      couponCode: applied?.valid ? applied.coupon?.code : undefined,
    });
    setPlacing(false);
    if (ok && resp) {
      setResult(resp);
      clearCart();
      clearCoupon();
      toast.success(t("checkoutSuccessToast"));
    } else {
      toast.error(t("error"));
    }
  }

  /* ================= success screen ================= */
  if (result) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <TopHeader />
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CircleCheck className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-emerald-900">{t("checkoutSuccess")}</h1>
                <p className="text-sm text-emerald-700">{t("checkoutSuccessBody")}</p>
              </div>
            </div>

            <ul className="mt-6 divide-y divide-emerald-200/70">
              {result.enrolled.map((e) => (
                <li key={e.courseId} className="flex items-center justify-between gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => openCourse(e.courseId)}
                    className="min-w-0 text-left text-sm font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {e.title}
                  </button>
                  <div className="flex shrink-0 items-center gap-2 text-sm">
                    {e.pricePaid < e.fullPrice && (
                      <span className="text-xs text-muted-foreground line-through">${e.fullPrice.toFixed(2)}</span>
                    )}
                    <span className="font-bold text-slate-900">${e.pricePaid.toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1.5 rounded-xl bg-white/80 p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("subtotal")}</span>
                <span>${result.totals.subtotal.toFixed(2)}</span>
              </div>
              {result.totals.discount > 0 && (
                <div className="flex justify-between font-medium text-emerald-600">
                  <span>
                    {t("discount")} · {result.coupon?.code} (−{result.coupon?.percentOff}%)
                  </span>
                  <span>−${result.totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>{t("orderTotal")}</span>
                <span>${result.totals.total.toFixed(2)}</span>
              </div>
            </div>

            {result.skippedOwned.length > 0 && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {t("skippedOwned")}: {result.skippedOwned.map((s) => s.title).join(" · ")}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setView("student")}>
                <BadgeCheck className="mr-2 h-4 w-4" />
                {t("goToMyLearning")}
              </Button>
              <Button variant="outline" onClick={() => setView("marketplace")}>
                {t("continueShopping")}
              </Button>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  /* ================= empty cart ================= */
  if (!loading && !courses.length) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <TopHeader />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
          <EmptyState
            icon={ShoppingCart}
            title={t("cartEmpty")}
            action={
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setView("marketplace")}>
                {t("browseCourses")}
              </Button>
            }
          />
        </div>
        <SiteFooter />
      </div>
    );
  }

  /* ================= cart ================= */
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopHeader />

      <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/60 to-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600" onClick={() => setView("marketplace")}>
            <ArrowLeft className="h-4 w-4" />
            {t("continueShopping")}
          </Button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-12">
        {/* items column */}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t("cartTitle")}{" "}
            <span className="text-base font-semibold text-muted-foreground">
              ({courses.length} {t("cartItemsLabel")})
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("cartSubtitle")}</p>

          <div className="mt-6 space-y-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border p-4">
                    <Skeleton className="h-20 w-32 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              : courses.map((c) => {
                  const owned = ownedIds.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 sm:flex-row"
                    >
                      <button
                        type="button"
                        onClick={() => openCourse(c.id)}
                        className="shrink-0 overflow-hidden rounded-xl text-left"
                        aria-label={c.title}
                      >
                        <CourseCover gradient={c.coverGradient} category={c.category} className="h-24 w-full sm:w-36" iconSize={30} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openCourse(c.id)}
                          className="line-clamp-2 text-left text-[15px] font-semibold leading-snug text-slate-900 hover:text-indigo-700"
                        >
                          {c.title}
                        </button>
                        <p className="mt-0.5 text-xs text-muted-foreground">{c.instructor.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <LevelBadge level={c.level} />
                          <span className="text-xs text-muted-foreground">
                            {c.lessonsCount} {t("totalLessons")} · {Math.round(c.durationMinutes / 60)} {t("hoursLabel")}
                          </span>
                        </div>
                        {owned && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" />
                            {t("owned")}
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <span className="text-lg font-bold text-slate-900">${c.price.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs text-muted-foreground hover:text-red-600"
                          onClick={() => {
                            removeFromCart(c.id);
                            if (applied) setApplied(null);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("removeItem")}
                        </Button>
                      </div>
                    </div>
                  );
                })}

            {courses.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setApplied(null);
                }}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-red-600 hover:underline"
              >
                {t("clearCart")}
              </button>
            )}
          </div>
        </div>

        {/* order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
            <h2 className="text-base font-bold text-slate-900">{t("orderSummary")}</h2>

            {/* coupon input */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700" htmlFor="coupon-input">
                {t("couponCodeLabel")}
              </label>
              {applied?.valid && applied.coupon ? (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Ticket className="h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-bold text-emerald-800">
                        {applied.coupon.code} · −{applied.coupon.percentOff}%
                      </p>
                      <p className="truncate text-[11px] text-emerald-700">
                        {applied.coupon.scopeCourseTitle
                          ? `${t("appliesTo")}: ${applied.coupon.scopeCourseTitle}`
                          : t("couponScopeAll")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="shrink-0 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {t("removeItem")}
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Input
                    id="coupon-input"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={t("couponPlaceholder")}
                    className="h-10 font-mono uppercase placeholder:normal-case"
                    maxLength={20}
                  />
                  <Button
                    variant="outline"
                    className="h-10 shrink-0"
                    disabled={!couponInput.trim() || checkingCoupon || !courses.length}
                    onClick={applyCoupon}
                  >
                    {checkingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : t("applyCoupon")}
                  </Button>
                </div>
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                <Sparkles className="mr-1 inline h-3 w-3 text-indigo-500" />
                {t("couponHint")}
              </p>
            </div>

            {/* totals */}
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {t("subtotal")} · {checkoutable.length} {t("cartItemsLabel")}
                </span>
                <span className="font-medium text-slate-900">${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between font-semibold text-emerald-600">
                  <span>{t("discount")}</span>
                  <span>−${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("taxesLabel")}</span>
                <span>—</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                <span className="text-base font-bold text-slate-900">{t("orderTotal")}</span>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  ${Math.max(0, totals.total).toFixed(2)}
                </span>
              </div>
            </div>

            {user && user.role !== "STUDENT" && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {lang === "zh"
                  ? "当前账户为讲师/管理员，需以学生身份登录后结算。"
                  : "You're signed in as instructor/admin — sign in as a student to check out."}
              </p>
            )}

            <Button
              size="lg"
              className={`mt-5 w-full gap-2 text-base ${stripeEnabled ? "bg-[#635bff] hover:bg-[#5851ea]" : "bg-indigo-600 hover:bg-indigo-700"}`}
              disabled={placing || !courses.length || (user?.role === "STUDENT" && !checkoutable.length)}
              onClick={checkout}
            >
              {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : stripeEnabled ? <CreditCard className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {placing
                ? t("checkoutProcessing")
                : stripeEnabled
                  ? t("checkoutStripe")
                  : t("checkout")}
            </Button>

            {stripeEnabled ? (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[#635bff]" />
                {stripeCfg?.mode === "live" ? t("stripeSecureLive") : t("stripeSecureTest")}
              </p>
            ) : (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                <ShoppingBag className="mr-1 inline h-3 w-3" />
                {t("loginFooterNote")}
              </p>
            )}
          </div>

          {/* trust list */}
          <ul className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-3.5 w-3.5 text-indigo-600" />
              {t("refundPolicy")}
            </li>
            <li className="flex items-center gap-2">
              <CircleCheck className="h-3.5 w-3.5 text-indigo-600" />
              {t("certificate")}
            </li>
            <li className="flex items-center gap-2">
              <CircleCheck className="h-3.5 w-3.5 text-indigo-600" />
              {t("lifetimeAccess")}
            </li>
          </ul>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
