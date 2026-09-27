"use client";

import React, { useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { useApi, apiPost } from "@/hooks/use-api";
import { CertificateModal } from "@/components/platform/certificate";
import { Avatar } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  FileText,
  Lock,
  NotebookPen,
  Play,
  Pause,
  PartyPopper,
} from "lucide-react";
import type { LearningData, LearningLesson } from "@/lib/types";

/* deterministic-ish lesson summary text */
function lessonSummary(title: string, lang: "en" | "zh") {
  if (lang === "zh") {
    return `本课时「${title}」将带你逐层拆解核心概念：先讲清楚为什么需要它，再通过一个可运行的最小示例演示具体做法，最后给出工程实践中的注意事项与常见陷阱。建议跟随练习文件同步操作，完成后立即完成右侧的知识点测验以巩固记忆。`;
  }
  return `In this lesson — "${title}" — we break the topic down layer by layer: why it matters, how it works through a minimal runnable example, and the practical pitfalls engineers hit in production. Follow along with the exercise files, then take the knowledge check to lock the concepts in.`;
}

export function CoursePlayer() {
  const { t, lang } = useI18n();
  const { user, learningCourseId, learningLessonId, setView, openCourse } = useApp();

  const { data, loading } = useApi<LearningData>(
    learningCourseId ? `/api/learning?courseId=${learningCourseId}${user ? `&studentId=${user.id}` : ""}` : null,
  );

  const [lessons, setLessons] = useState<LearningLesson[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesSaved, setNotesSaved] = useState<"idle" | "saving" | "saved">("idle");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enrollmentId = data?.enrollment?.enrollmentId ?? null;
  const isEnrolled = !!enrollmentId;
  const isInstructorOrAdmin = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";

  // sync local state when the loaded course changes (render-time adjustment pattern)
  const dataKey = data ? learningCourseId : null;
  const [syncKey, setSyncKey] = useState<string | null>(null);
  if (data && dataKey !== syncKey) {
    setSyncKey(dataKey);
    setLessons(data.lessons);
    setProgress(data.enrollment?.progress ?? 0);
    const target =
      learningLessonId && data.lessons.some((l) => l.id === learningLessonId)
        ? learningLessonId
        : (data.lessons.find((l) => !l.completed)?.id ?? data.lessons[0]?.id ?? null);
    setCurrentId(target);
    setPlaying(false);
  }

  // load notes from localStorage when the course changes
  const [notesKey, setNotesKey] = useState<string | null>(null);
  if (learningCourseId && learningCourseId !== notesKey) {
    setNotesKey(learningCourseId);
    try {
      const raw = localStorage.getItem(`learnhub-notes-${learningCourseId}`);
      setNotes(raw ? JSON.parse(raw) : {});
    } catch {
      setNotes({});
    }
  }

  const current = useMemo(() => lessons.find((l) => l.id === currentId) ?? null, [lessons, currentId]);
  const currentIndex = useMemo(() => lessons.findIndex((l) => l.id === currentId), [lessons, currentId]);
  const completedCount = useMemo(() => lessons.filter((l) => l.completed).length, [lessons]);
  const canComplete = isEnrolled && !!current;
  const lessonAccessible = (l: LearningLesson) =>
    isEnrolled || isInstructorOrAdmin || l.isPreview;

  function goto(index: number) {
    if (index < 0 || index >= lessons.length) return;
    const target = lessons[index];
    if (!lessonAccessible(target)) {
      toast.info(t("playerPreviewOnly"));
      return;
    }
    setCurrentId(target.id);
    setPlaying(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  async function toggleComplete() {
    if (!current || !enrollmentId || !user) return;
    setToggling(true);
    const next = !current.completed;
    const { ok, data: resp } = await apiPost<{ progress: number }>("/api/progress", {
      enrollmentId,
      lessonId: current.id,
      completed: next,
    });
    setToggling(false);
    if (ok && resp) {
      setLessons((prev) => prev.map((l) => (l.id === current.id ? { ...l, completed: next } : l)));
      setProgress(resp.progress);
      if (resp.progress >= 100) {
        toast.success(t("playerCongrats"));
      }
    } else {
      toast.error(t("error"));
    }
  }

  function onNotesChange(value: string) {
    if (!currentId) return;
    const next = { ...notes, [currentId]: value };
    setNotes(next);
    setNotesSaved("saving");
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(`learnhub-notes-${learningCourseId}`, JSON.stringify(next));
        setNotesSaved("saved");
      } catch {
        /* ignore */
      }
    }, 600);
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950">
        <div className="h-16 border-b border-white/10" />
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Skeleton className="h-96 w-full rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  const course = data.course;
  const pct = isEnrolled ? progress : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setView(isEnrolled && user?.role === "STUDENT" ? "student" : "marketplace")}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("playerBackToLearning")}</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{course.title}</p>
            <p className="truncate text-xs text-slate-400">
              {t("playerLessonLabel")} {Math.max(currentIndex + 1, 1)} {t("playerOf")} {lessons.length} ·{" "}
              {course.instructor.name}
            </p>
          </div>
          {isEnrolled && (
            <div className="hidden w-40 shrink-0 sm:block">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>{pct}%</span>
                <span>{t("playerProgressLabel")}</span>
              </div>
              <ProgressBar value={pct} className="h-1.5 bg-white/10" />
            </div>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {isEnrolled && pct >= 100 && (
              <Button size="sm" className="gap-1.5 bg-amber-500 text-amber-950 hover:bg-amber-400" onClick={() => setCertOpen(true)}>
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">{t("getCertificate")}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-0 px-0 py-0 lg:grid-cols-[1fr_340px] lg:gap-8 lg:px-8 lg:py-8">
        {/* main column */}
        <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-0 lg:py-0">
          {/* video area */}
          <div className="relative overflow-hidden rounded-none bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 lg:rounded-2xl">
            <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="playergrid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M28 0H0v28" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#playergrid)" />
              </svg>
            </div>
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 p-6 text-center">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="group flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:scale-105 hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/50"
                aria-label={playing ? "pause" : "play"}
              >
                {playing ? (
                  <Pause className="h-9 w-9 text-white" />
                ) : (
                  <Play className="h-9 w-9 translate-x-0.5 text-white" />
                )}
              </button>
              <div>
                <p className="text-lg font-bold text-white sm:text-xl">
                  {current ? current.title : course.title}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {current ? `${current.durationMinutes} ${t("lessonDuration")}` : course.subtitle}
                </p>
              </div>
              {playing && (
                <div className="flex w-full max-w-md items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
                    ● REC · demo playback
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* preview banner */}
          {!isEnrolled && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
              <p className="text-sm text-amber-200">{t("playerPreviewOnly")}</p>
              <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={() => openCourse(course.id)}>
                {t("playerEnrollNow")}
              </Button>
            </div>
          )}

          {/* congrats card */}
          {isEnrolled && pct >= 100 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <PartyPopper className="h-6 w-6 text-emerald-300" />
                <div>
                  <p className="text-sm font-bold text-emerald-200">{t("playerCongrats")}</p>
                  <p className="text-xs text-emerald-300/80">{t("playerCongratsBody")}</p>
                </div>
              </div>
              <Button size="sm" className="gap-1.5 bg-amber-500 text-amber-950 hover:bg-amber-400" onClick={() => setCertOpen(true)}>
                <Award className="h-4 w-4" />
                {t("getCertificate")}
              </Button>
            </div>
          )}

          {/* lesson title + actions */}
          {current && (
            <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {t("playerLessonLabel")} {currentIndex + 1}: {current.title}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {current.completed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("playerCompleted")}
                    </span>
                  ) : (
                    `${current.durationMinutes} ${t("lessonDuration")}`
                  )}
                </p>
              </div>
              {canComplete && (
                <Button
                  variant={current.completed ? "outline" : "default"}
                  className={current.completed ? "border-white/20 bg-transparent text-white hover:bg-white/10" : "bg-indigo-600 hover:bg-indigo-700"}
                  onClick={toggleComplete}
                  disabled={toggling}
                >
                  {current.completed ? (
                    <>
                      <Circle className="h-4 w-4" />
                      {t("playerMarkIncomplete")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {t("playerMarkComplete")}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* tabs: overview / notes */}
          {current && (
            <Accordion type="multiple" defaultValue={["overview"]} className="mt-6">
              <AccordionItem value="overview" className="border-white/10">
                <AccordionTrigger className="py-3 text-sm font-semibold text-slate-200 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                    {t("playerTabOverview")}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pb-2">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t("playerLessonSummary")}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-300">
                        {lessonSummary(current.title, lang)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t("playerResources")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: FileText, label: t("playerResourceSlides") },
                          { icon: Download, label: t("playerResourceCode") },
                          { icon: NotebookPen, label: t("playerResourceQuiz") },
                        ].map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                          >
                            <r.icon className="h-3.5 w-3.5 text-indigo-400" />
                            {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="notes" className="border-white/10">
                <AccordionTrigger className="py-3 text-sm font-semibold text-slate-200 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <NotebookPen className="h-4 w-4 text-indigo-400" />
                    {t("playerTabNotes")}
                    {notesSaved === "saving" && (
                      <span className="text-[10px] font-normal text-slate-500">{t("playerNotesSaving")}</span>
                    )}
                    {notesSaved === "saved" && (
                      <span className="text-[10px] font-normal text-emerald-400">{t("playerNotesSaved")}</span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <textarea
                    value={notes[current.id] ?? ""}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder={t("playerNotesPlaceholder")}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* prev / next */}
          {current && (
            <div className="mt-6 flex items-center justify-between gap-3 pb-8">
              <Button
                variant="outline"
                className="border-white/15 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
                onClick={() => goto(currentIndex - 1)}
                disabled={currentIndex <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("playerPrev")}
              </Button>
              <span className="text-xs tabular-nums text-slate-500">
                {completedCount}/{lessons.length}
              </span>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => goto(currentIndex + 1)}
                disabled={currentIndex >= lessons.length - 1}
              >
                {t("playerNext")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* mobile lessons list */}
          <Accordion type="multiple" className="mb-8 lg:hidden">
            <AccordionItem value="content" className="border-white/10">
              <AccordionTrigger className="py-3 text-sm font-semibold text-slate-200 hover:no-underline">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  {t("playerCourseContent")}
                  <span className="text-xs font-normal text-slate-500">
                    {completedCount}/{lessons.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <LessonList
                  lessons={lessons}
                  currentId={currentId}
                  onSelect={(id) => {
                    const idx = lessons.findIndex((l) => l.id === id);
                    goto(idx);
                  }}
                  accessible={lessonAccessible}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* desktop sidebar */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit lg:max-h-[calc(100vh-8rem)] lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-bold text-white">
                {t("playerCourseContent")}
              </p>
              <span className="text-xs tabular-nums text-slate-400">
                {completedCount}/{lessons.length}
              </span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <LessonList
                lessons={lessons}
                currentId={currentId}
                onSelect={(id) => {
                  const idx = lessons.findIndex((l) => l.id === id);
                  goto(idx);
                }}
                accessible={lessonAccessible}
              />
            </div>
            {/* instructor card */}
            <div className="flex items-center gap-3 border-t border-white/10 p-4">
              <Avatar name={course.instructor.name} color={course.instructor.avatarColor} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{course.instructor.name}</p>
                <p className="truncate text-xs text-slate-400">{course.instructor.headline ?? ""}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* certificate modal */}
      <CertificateModal
        open={certOpen}
        onClose={() => setCertOpen(false)}
        studentName={user?.name ?? ""}
        courseTitle={course.title}
        instructorName={course.instructor.name}
        hours={Math.round(course.durationMinutes / 60)}
        lessons={course.lessonsCount}
        completedAt={new Date().toISOString()}
        lang={lang}
      />
    </div>
  );
}

function LessonList({
  lessons,
  currentId,
  onSelect,
  accessible,
}: {
  lessons: LearningLesson[];
  currentId: string | null;
  onSelect: (id: string) => void;
  accessible: (l: LearningLesson) => boolean;
}) {
  const { t } = useI18n();
  return (
    <ul className="space-y-0.5">
      {lessons.map((l, i) => {
        const isActive = l.id === currentId;
        const ok = accessible(l);
        return (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => ok && onSelect(l.id)}
              disabled={!ok}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : ok
                    ? "text-slate-300 hover:bg-white/10 hover:text-white"
                    : "cursor-not-allowed text-slate-600"
              }`}
            >
              {l.completed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : ok ? (
                <Play className="h-4 w-4 shrink-0 opacity-70" />
              ) : (
                <Lock className="h-4 w-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {i + 1}. {l.title}
                </span>
                <span className={`block text-[11px] ${isActive ? "text-indigo-200" : "text-slate-500"}`}>
                  {l.durationMinutes} {t("lessonDuration")}
                  {l.isPreview && !l.completed ? ` · ${t("previewLesson")}` : ""}
                  {!ok ? ` · ${t("playerLockedLesson")}` : ""}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
