"use client";

import React from "react";
import { useI18n, localeOf } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { CourseCover, Rating, CourseMeta, LevelBadge } from "@/components/platform/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/platform/ui-bits";
import type { CourseWithInstructor } from "@/lib/types";
import { CircleCheck, Heart, ShoppingCart, Users } from "lucide-react";
import { toast } from "sonner";

export function CourseCard({
  course,
  wishlisted,
  onToggleWishlist,
}: {
  course: CourseWithInstructor;
  wishlisted?: boolean;
  onToggleWishlist?: (courseId: string) => void;
}) {
  const { t, lang } = useI18n();
  const { openCourse, cart, addToCart, setView } = useApp();
  const isBestseller = course.ratingCount > 1500;
  const inCart = cart.some((i) => i.courseId === course.id);

  function quickAddToCart() {
    const added = addToCart(course.id);
    toast.success(added ? t("addedToCartToast") : t("alreadyInCartToast"));
    if (!added) setView("cart");
  }

  return (
    <div className="group relative h-full">
      <button
        type="button"
        onClick={() => openCourse(course.id)}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <div className="relative">
          <CourseCover gradient={course.coverGradient} category={course.category} className="h-36 w-full" iconSize={44} />
          {isBestseller && (
            <Badge className="absolute right-2 top-2 border-0 bg-amber-400 text-[11px] font-bold text-amber-950 shadow">
              {t("bestseller")}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-indigo-700">
            {course.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{course.instructor.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Rating value={course.rating} count={course.ratingCount} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LevelBadge level={course.level} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {course.studentsCount.toLocaleString(localeOf(lang))} {t("studentsCount")}
            </span>
          </div>
          <CourseMeta lessons={course.lessonsCount} minutes={course.durationMinutes} />
          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="text-lg font-bold text-slate-900">${course.price.toFixed(2)}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  quickAddToCart();
                }}
                aria-label={inCart ? t("inCartGoToCart") : t("addToCart")}
                title={inCart ? t("inCartGoToCart") : t("addToCart")}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-110 ${
                  inCart
                    ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {inCart ? <CircleCheck className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              </button>
              <Avatar name={course.instructor.name} color={course.instructor.avatarColor} size="sm" />
            </div>
          </div>
        </div>
      </button>

      {/* wishlist heart */}
      {onToggleWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(course.id);
          }}
          aria-label={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
          className={`absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur transition hover:scale-110 ${
            isBestseller ? "top-11" : ""
          } ${
            wishlisted
              ? "bg-rose-500 text-white"
              : "bg-white/90 text-slate-500 hover:text-rose-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-white" : ""}`} />
        </button>
      )}
    </div>
  );
}
