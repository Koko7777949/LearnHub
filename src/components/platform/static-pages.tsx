"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { TopHeader, SiteFooter } from "@/components/platform/app-shell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Award,
  BookOpen,
  ChevronRight,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Lightbulb,
  LineChart,
  Scale,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

/* ============================== ABOUT ============================== */
export function AboutView() {
  const { t } = useI18n();
  const { setView } = useApp();

  const values = [
    {
      icon: HeartHandshake,
      title: t("aboutValue1Title"),
      body: t("aboutValue1Body"),
    },
    {
      icon: Scale,
      title: t("aboutValue2Title"),
      body: t("aboutValue2Body"),
    },
    {
      icon: Award,
      title: t("aboutValue3Title"),
      body: t("aboutValue3Body"),
    },
    {
      icon: Globe2,
      title: t("aboutValue4Title"),
      body: t("aboutValue4Body"),
    },
  ];

  const milestones = [
    { year: "2024", label: t("aboutMilestone2024") },
    { year: "2025", label: t("aboutMilestone2025") },
    { year: "2026", label: t("aboutMilestone2026") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopHeader />

      {/* hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-indigo-50/80 via-white to-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            {t("aboutBadge")}
          </span>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {t("aboutTitle1")}{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              {t("aboutTitle2")}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {t("aboutMissionBody")}
          </p>
        </div>
      </section>

      {/* stats band */}
      <section className="border-b border-slate-200 bg-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: BookOpen, value: "10+", label: t("aboutStatCourses") },
            { icon: Users, value: "88+", label: t("aboutStatEnrollments") },
            { icon: Globe2, value: "40+", label: t("aboutStatCountries") },
            { icon: Star, value: "4.3", label: t("aboutStatRating") },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5 text-center">
              <s.icon className="h-5 w-5 text-indigo-400" />
              <p className="text-2xl font-bold text-white sm:text-3xl">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* story */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t("aboutStoryTitle")}</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-600">
          <p>{t("aboutStoryBody1")}</p>
          <p>{t("aboutStoryBody2")}</p>
        </div>

        {/* milestones */}
        <ol className="mt-8 space-y-4 border-l-2 border-indigo-100 pl-6">
          {milestones.map((m) => (
            <li key={m.year} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500" aria-hidden />
              <p className="text-sm font-bold text-indigo-700">{m.year}</p>
              <p className="mt-0.5 text-sm text-slate-600">{m.label}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* values */}
      <section className="border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">{t("aboutValuesTitle")}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{t("aboutCtaTitle")}</h2>
            <p className="mt-2 max-w-xl text-sm text-indigo-100">{t("aboutCtaBody")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" className="gap-2" onClick={() => setView("marketplace")}>
              <GraduationCap className="h-4 w-4" />
              {t("browseCourses")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setView("login")}
            >
              {t("aboutStartTeaching")}
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ============================== FAQ ============================== */
type FaqItem = { q: string; a: string };

export function FaqView() {
  const { t } = useI18n();
  const { setView } = useApp();

  const groups: { icon: React.ElementType; title: string; items: FaqItem[] }[] = [
    {
      icon: GraduationCap,
      title: t("faqGroupGettingStarted"),
      items: [
        { q: t("faqStart1Q"), a: t("faqStart1A") },
        { q: t("faqStart2Q"), a: t("faqStart2A") },
        { q: t("faqStart3Q"), a: t("faqStart3A") },
        { q: t("faqStart4Q"), a: t("faqStart4A") },
      ],
    },
    {
      icon: Landmark,
      title: t("faqGroupPayments"),
      items: [
        { q: t("faqPay1Q"), a: t("faqPay1A") },
        { q: t("faqPay2Q"), a: t("faqPay2A") },
        { q: t("faqPay3Q"), a: t("faqPay3A") },
        { q: t("faqPay4Q"), a: t("faqPay4A") },
      ],
    },
    {
      icon: Award,
      title: t("faqGroupCertificates"),
      items: [
        { q: t("faqCert1Q"), a: t("faqCert1A") },
        { q: t("faqCert2Q"), a: t("faqCert2A") },
        { q: t("faqCert3Q"), a: t("faqCert3A") },
      ],
    },
    {
      icon: LineChart,
      title: t("faqGroupInstructors"),
      items: [
        { q: t("faqInst1Q"), a: t("faqInst1A") },
        { q: t("faqInst2Q"), a: t("faqInst2A") },
        { q: t("faqInst3Q"), a: t("faqInst3A") },
        { q: t("faqInst4Q"), a: t("faqInst4A") },
      ],
    },
    {
      icon: Scale,
      title: t("faqGroupRefunds"),
      items: [
        { q: t("faqRef1Q"), a: t("faqRef1A") },
        { q: t("faqRef2Q"), a: t("faqRef2A") },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopHeader />

      {/* hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/70 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Lightbulb className="h-3.5 w-3.5" />
            {t("faqBadge")}
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{t("faqTitle")}</h1>
          <p className="mt-4 text-base text-slate-600">{t("faqSubtitle")}</p>
        </div>
      </section>

      {/* groups */}
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {groups.map((g) => (
            <div key={g.title}>
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                <span className="inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <g.icon className="h-4.5 w-4.5" />
                </span>
                {g.title}
              </h2>
              <Accordion type="multiple" className="mt-3">
                {g.items.map((item, i) => (
                  <AccordionItem key={i} value={`${g.title}-${i}`} className="border-slate-200">
                    <AccordionTrigger className="py-3.5 text-left text-[15px] font-semibold text-slate-800 hover:text-indigo-700 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-slate-600">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* still stuck CTA */}
        <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 text-center">
          <h3 className="text-base font-bold text-slate-900">{t("faqStillStuck")}</h3>
          <p className="mt-1.5 text-sm text-slate-600">{t("faqStillStuckBody")}</p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setView("marketplace")}>
            {t("browseCourses")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
