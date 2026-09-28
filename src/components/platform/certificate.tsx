"use client";

import React from "react";
import { useI18n, localeOf, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, Printer } from "lucide-react";

function certId(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `LH-${h.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function CertificateModal({
  open,
  onClose,
  studentName,
  courseTitle,
  instructorName,
  hours,
  lessons,
  completedAt,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  hours: number;
  lessons: number;
  completedAt: string;
  lang: Lang;
}) {
  const { t } = useI18n();
  if (!open) return null;

  const dateStr = new Date(completedAt).toLocaleDateString(localeOf(lang), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* print isolation styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .cert-print, .cert-print * { visibility: visible !important; }
          .cert-print {
            position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
            background: white; padding: 24px; overflow: visible;
          }
          .cert-no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
        <div className="cert-print relative w-full max-w-3xl">
          {/* certificate card */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-1 shadow-2xl">
            <div className="rounded-[14px] border-[10px] border-double border-amber-300/90 p-8 sm:p-12">
              {/* corner ornaments */}
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute left-6 top-6 h-14 w-14 border-l-4 border-t-4 border-amber-400/60" />
                <div className="absolute right-6 top-6 h-14 w-14 border-r-4 border-t-4 border-amber-400/60" />
                <div className="absolute bottom-6 left-6 h-14 w-14 border-b-4 border-l-4 border-amber-400/60" />
                <div className="absolute bottom-6 right-6 h-14 w-14 border-b-4 border-r-4 border-amber-400/60" />
              </div>

              <div className="flex flex-col items-center text-center">
                {/* brand */}
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    Learn<span className="text-indigo-600">Hub</span>
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                    {t("certificateTitle")}
                  </span>
                </div>

                <p className="mt-8 text-sm text-slate-500">{t("certificateThisCertifies")}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  {studentName}
                </p>
                <p className="mt-4 max-w-xl text-sm text-slate-500">{t("certificateHasCompleted")}</p>
                <p className="mt-2 max-w-xl text-lg font-bold leading-snug text-indigo-700 sm:text-xl">
                  {courseTitle}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {lessons} {t("totalLessons")} · {hours} {t("hoursLabel")}
                </p>

                {/* signatures */}
                <div className="mt-10 grid w-full max-w-lg grid-cols-2 gap-8 text-center">
                  <div>
                    <div className="mx-auto w-40 border-b border-slate-300 pb-1 font-[cursive] text-lg italic text-slate-800">
                      {instructorName}
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("certificateInstructorSig")}
                    </p>
                  </div>
                  <div>
                    <div className="mx-auto flex w-40 items-center justify-center border-b border-slate-300 pb-1">
                      <Award className="h-5 w-5 text-indigo-600" />
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("certificatePlatformSig")}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] text-slate-400">
                  <span>
                    {t("certificateDate")}: <span className="font-semibold text-slate-600">{dateStr}</span>
                  </span>
                  <span>
                    {t("certificateId")}: <span className="font-mono font-semibold text-slate-600">{certId(courseTitle + studentName)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="cert-no-print mt-4 flex items-center justify-center gap-3">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t("printCertificate")}
            </Button>
            <Button variant="outline" className="bg-white hover:bg-slate-50" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
