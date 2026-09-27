"use client";

import React, { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost } from "@/hooks/use-api";
import { Avatar, Rating } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, MessageSquareQuote, Pencil, Star } from "lucide-react";
import type { CourseReview } from "@/lib/types";
import { fmtDate } from "@/lib/format";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Star
            className={`h-7 w-7 transition ${
              n <= shown ? "fill-amber-500 text-amber-500" : "fill-transparent text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseReviews({ courseId }: { courseId: string }) {
  const { t, lang } = useI18n();
  const { user } = useApp();
  const { data, loading, refetch } = useApi<{ reviews: CourseReview[] }>(`/api/reviews?courseId=${courseId}`);
  const { data: myData } = useApi<{ purchases: { course: { id: string } }[] }>(
    user?.role === "STUDENT" ? `/api/enrollments?studentId=${user.id}` : null,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reviews = data?.reviews || [];
  const owned = useMemo(
    () => !!myData?.purchases?.some((p) => p.course.id === courseId),
    [myData, courseId],
  );
  const myReview = useMemo(() => reviews.find((r) => r.student.id === user?.id), [reviews, user]);

  const breakdown = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    const total = reviews.length;
    return { counts, total };
  }, [reviews]);

  function openDialog() {
    setRating(myReview?.rating ?? 5);
    setComment(myReview?.comment ?? "");
    setDialogOpen(true);
  }

  async function submit() {
    if (!user) return;
    if (!comment.trim()) {
      toast.error(t("reviewPlaceholder"));
      return;
    }
    setSubmitting(true);
    const { ok } = await apiPost("/api/reviews", {
      courseId,
      studentId: user.id,
      rating,
      comment: comment.trim(),
    });
    setSubmitting(false);
    if (ok) {
      toast.success(t("reviewSubmitted"));
      setDialogOpen(false);
      refetch();
    } else {
      toast.error(t("error"));
    }
  }

  return (
    <section className="mt-8" aria-label={t("reviewsTitle")}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t("reviewsTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("reviewsRecentSubtitle")}</p>
        </div>
        {owned && (
          <Button size="sm" variant={myReview ? "outline" : "default"} className="gap-1.5" onClick={openDialog}>
            {myReview ? <Pencil className="h-3.5 w-3.5" /> : <MessageSquareQuote className="h-3.5 w-3.5" />}
            {myReview ? t("editReview") : t("writeReview")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-slate-50/60 p-8 text-center text-sm text-muted-foreground">
          {t("reviewsEmpty")}
        </div>
      ) : (
        <>
          {/* breakdown */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-2.5 text-xs font-semibold text-slate-700">{t("ratingBreakdown")}</p>
            <div className="grid gap-1.5 sm:grid-cols-5 sm:gap-3">
              {breakdown.counts.map(({ star, count }) => {
                const pct = breakdown.total ? Math.round((count / breakdown.total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="flex w-8 shrink-0 items-center gap-0.5 font-semibold text-slate-700">
                      {star}
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-7 shrink-0 text-right tabular-nums text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* list */}
          <div className="space-y-3">
            {reviews.slice(0, 8).map((r) => {
              const isMine = r.student.id === user?.id;
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-4 ${
                    isMine ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={r.student.name} color={r.student.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{r.student.name}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("verifiedLearner")}
                        </span>
                        {isMine && (
                          <Badge className="border-0 bg-indigo-100 text-[10px] font-bold text-indigo-700">
                            {t("yourReviewBadge")}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-3.5 w-3.5 ${
                                n <= r.rating ? "fill-amber-500 text-amber-500" : "fill-transparent text-slate-300"
                              }`}
                            />
                          ))}
                        </span>
                        <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt, lang)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{r.comment}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* write review dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{myReview ? t("editReview") : t("writeReview")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{t("yourRating")}</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{t("reviewCommentLabel")}</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("reviewPlaceholder")}
                rows={5}
                maxLength={1000}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={submit} disabled={submitting || !rating}>
                {submitting ? "…" : t("submitReview")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
