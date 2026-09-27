"use client";

import React, { useState } from "react";
import { useI18n, trLevel } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { DashboardShell } from "@/components/platform/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, CircleCheck, Film, GraduationCap, Link2, Loader2, Plus, Rocket, Trash2, Upload } from "lucide-react";
import { apiPost } from "@/hooks/use-api";

const CATEGORIES = ["Development", "Business", "Design", "Data Science", "Marketing", "IT & Software"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const GRADIENTS = [
  { value: "from-indigo-500 via-violet-500 to-purple-600", label: "Indigo Violet" },
  { value: "from-teal-400 via-cyan-500 to-sky-600", label: "Teal Sky" },
  { value: "from-rose-400 via-pink-500 to-fuchsia-600", label: "Rose Fuchsia" },
  { value: "from-amber-400 via-orange-500 to-red-500", label: "Amber Red" },
  { value: "from-emerald-400 via-green-500 to-teal-600", label: "Emerald Teal" },
  { value: "from-slate-700 via-slate-800 to-indigo-900", label: "Midnight" },
  { value: "from-blue-600 via-indigo-600 to-violet-700", label: "Deep Blue" },
  { value: "from-cyan-500 via-sky-500 to-blue-600", label: "Ocean" },
];

interface DraftLesson {
  id: number;
  title: string;
  durationMinutes: number;
  videoUrl?: string;
  videoUploading?: boolean;
  videoName?: string;
}

export function InstructorStudio() {
  const { t, lang } = useI18n();
  const { user, setView } = useApp();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Development");
  const [level, setLevel] = useState("BEGINNER");
  const [price, setPrice] = useState("49.99");
  const [language, setLanguage] = useState(lang === "zh" ? "中文" : "English");
  const [gradient, setGradient] = useState(GRADIENTS[0].value);
  const [lessons, setLessons] = useState<DraftLesson[]>([
    { id: 1, title: "", durationMinutes: 15 },
    { id: 2, title: "", durationMinutes: 20 },
  ]);
  const [publishing, setPublishing] = useState(false);

  const totalMinutes = lessons.reduce((s, l) => s + (l.durationMinutes || 0), 0);

  function addLesson() {
    setLessons((prev) => [...prev, { id: Date.now(), title: "", durationMinutes: 15 }]);
  }
  function removeLesson(id: number) {
    setLessons((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }
  function moveLesson(id: number, dir: -1 | 1) {
    setLessons((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function updateLesson(id: number, patch: Partial<DraftLesson>) {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  /* ---- per-lesson video: MP4 upload or external URL ---- */
  async function uploadLessonVideo(lessonId: number, file: File) {
    if (!user) return;
    if (!file.type.startsWith("video/")) {
      toast.error(t("videoInvalidType"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("videoTooLarge"));
      return;
    }
    updateLesson(lessonId, { videoUploading: true, videoName: file.name });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("instructorId", user.id);
      const res = await fetch("/api/videos/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        updateLesson(lessonId, { videoUrl: data.url, videoUploading: false, videoName: file.name });
        toast.success(t("videoUploadedToast"));
      } else if (data?.error === "TOO_LARGE") {
        updateLesson(lessonId, { videoUploading: false });
        toast.error(t("videoTooLarge"));
      } else if (data?.error === "FORBIDDEN") {
        updateLesson(lessonId, { videoUploading: false });
        toast.error(t("error"));
      } else {
        updateLesson(lessonId, { videoUploading: false });
        toast.error(t("videoUploadFailed"));
      }
    } catch {
      updateLesson(lessonId, { videoUploading: false });
      toast.error(t("videoUploadFailed"));
    }
  }

  function validateVideoUrl(lessonId: number, url: string) {
    const v = url.trim();
    if (!v || /^https:\/\//i.test(v) || /^\/api\/videos\//.test(v)) {
      updateLesson(lessonId, { videoUrl: v || undefined, videoName: v ? undefined : undefined });
      return;
    }
    toast.error(t("videoUrlInvalid"));
  }

  async function publish() {
    if (!user) return;
    if (!title.trim()) {
      toast.error(t("errTitleRequired"));
      return;
    }
    const cleanLessons = lessons.filter((l) => l.title.trim());
    if (!cleanLessons.length) {
      toast.error(t("errLessonsRequired"));
      return;
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 999) {
      toast.error(t("errPriceInvalid"));
      return;
    }
    setPublishing(true);
    const { ok } = await apiPost("/api/instructor/courses", {
      instructorId: user.id,
      title,
      subtitle,
      description,
      category,
      level,
      price: priceNum,
      language,
      coverGradient: gradient,
      lessons: cleanLessons.map((l) => ({
        title: l.title,
        durationMinutes: l.durationMinutes,
        videoUrl: l.videoUrl?.trim() || undefined,
      })),
    });
    setPublishing(false);
    if (ok) {
      toast.success(t("coursePublished"));
      setView("instructor");
    } else {
      toast.error(t("error"));
    }
  }

  return (
    <DashboardShell
      title={t("studioTitle")}
      subtitle={t("studioSubtitle")}
      actions={
        <Button variant="outline" className="gap-1.5" onClick={() => setView("instructor")}>
          <GraduationCap className="h-4 w-4" />
          {t("navInstructor")}
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* basics */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-bold text-slate-900">{t("createCourse")}</h2>
          <div className="mt-5 grid gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor="c-title">{t("fieldTitle")} *</Label>
              <Input
                id="c-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("fieldTitlePlaceholder")}
                maxLength={150}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-subtitle">{t("fieldSubtitle")}</Label>
              <Input
                id="c-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder={t("fieldSubtitlePlaceholder")}
                maxLength={200}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-desc">{t("fieldDescription")}</Label>
              <Textarea
                id="c-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("fieldDescriptionPlaceholder")}
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>{t("fieldCategory")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("fieldLevel")}</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {trLevel(l, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-price">{t("fieldPrice")}</Label>
                <Input
                  id="c-price"
                  type="number"
                  min={0}
                  max={999}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("fieldLanguage")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="中文">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("fieldCoverTheme")}</Label>
              <div className="flex flex-wrap gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGradient(g.value)}
                    className={`h-10 w-16 rounded-lg bg-gradient-to-br transition ${g.value} ${
                      gradient === g.value
                        ? "scale-105 ring-2 ring-indigo-500 ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    aria-label={g.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* curriculum */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">{t("lessonsBuilder")}</h2>
            <span className="text-xs text-muted-foreground">
              {lessons.length} {t("totalLessons")} · {Math.round((totalMinutes / 60) * 10) / 10} {t("hoursLabel")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("lessonsBuilderHint")}</p>

          <div className="mt-4 space-y-2.5">
            {lessons.map((l, i) => (
              <div key={l.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm">
                    {i + 1}
                  </span>
                  <Input
                    value={l.title}
                    onChange={(e) => updateLesson(l.id, { title: e.target.value })}
                    placeholder={t("lessonTitlePlaceholder")}
                    className="min-w-0 flex-1 bg-white"
                    maxLength={150}
                  />
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={5}
                      max={180}
                      value={l.durationMinutes}
                      onChange={(e) => updateLesson(l.id, { durationMinutes: parseInt(e.target.value) || 15 })}
                      className="w-20 bg-white text-right"
                    />
                    <span className="text-xs text-muted-foreground">{t("lessonDuration")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500"
                      onClick={() => moveLesson(l.id, -1)}
                      disabled={i === 0}
                      aria-label="move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500"
                      onClick={() => moveLesson(l.id, 1)}
                      disabled={i === lessons.length - 1}
                      aria-label="move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => removeLesson(l.id)}
                      disabled={lessons.length <= 1}
                      aria-label={t("removeLesson")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* per-lesson video */}
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-2 pl-0 sm:pl-10">
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <Film className="h-3.5 w-3.5 text-indigo-500" />
                    {t("lessonVideoLabel")}
                  </span>
                  <div className="relative min-w-[180px] flex-1">
                    <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={l.videoUrl ?? ""}
                      onChange={(e) => updateLesson(l.id, { videoUrl: e.target.value })}
                      onBlur={(e) => validateVideoUrl(l.id, e.target.value)}
                      placeholder={t("lessonVideoUrlPlaceholder")}
                      className="h-8 bg-white pl-8 text-xs"
                      inputMode="url"
                    />
                  </div>
                  <label className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadLessonVideo(l.id, f);
                        e.currentTarget.value = "";
                      }}
                    />
                    {l.videoUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {l.videoUploading ? t("videoUploading") : t("videoUploadBtn")}
                  </label>
                  {l.videoUrl && !l.videoUploading && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      <CircleCheck className="h-3 w-3" />
                      {t("videoAttached")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t("lessonVideoHint")}</p>

          <Button variant="outline" className="mt-3 w-full gap-1.5 border-dashed" onClick={addLesson}>
            <Plus className="h-4 w-4" />
            {t("addLesson")}
          </Button>
        </section>

        {/* publish */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("lessonsBuilderHint")}
          </p>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={publish} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {publishing ? t("publishingCourse") : t("publishCourse")}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
