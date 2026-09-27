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
  const { t, lang } = useI18n();
  const { setView } = useApp();
  const zh = lang === "zh";

  const values = [
    {
      icon: HeartHandshake,
      title: zh ? "学习者至上" : "Learners first",
      body: zh
        ? "平台上的每个决策都从『是否帮助学习者真正掌握技能』出发——从课程结构到播放器体验。"
        : "Every product decision starts with one question: does this help a learner truly master a skill — from curriculum design to the player experience.",
    },
    {
      icon: Scale,
      title: zh ? "透明经济学" : "Transparent economics",
      body: zh
        ? "70/30 分成对讲师与学员完全公开。每笔销售、退款与平台佣金都记录在可导出的账本中。"
        : "Our 70/30 revenue share is public to instructors and learners. Every sale, refund and platform fee lives in an exportable ledger.",
    },
    {
      icon: Award,
      title: zh ? "质量把关" : "Quality bar",
      body: zh
        ? "课程由资深从业者打造，配套项目练习、结业证书与学员评价体系，保证学习成果可验证。"
        : "Courses are built by senior practitioners, with project work, completion certificates and verified student reviews.",
    },
    {
      icon: Globe2,
      title: zh ? "无界访问" : "Access without borders",
      body: zh
        ? "终身访问、多语言界面与随时随地的学习进度同步——教育不应有地理与时间的门槛。"
        : "Lifetime access, a bilingual interface and progress that follows you anywhere — education shouldn't have borders or office hours.",
    },
  ];

  const milestones = [
    { year: "2024", label: zh ? "LearnHub 立项：第一个 70/30 账本原型" : "LearnHub founded: first 70/30 ledger prototype" },
    { year: "2025", label: zh ? "10 门专家课程上线，学员遍布 40+ 国家" : "10 expert courses launched, learners in 40+ countries" },
    { year: "2026", label: zh ? "收益账本、即时打款与证书体系全面上线" : "Revenue ledger, instant payouts & certificates shipped" },
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
            { icon: BookOpen, value: "10+", label: zh ? "专家课程" : "Expert courses" },
            { icon: Users, value: "88+", label: zh ? "报名人次" : "Enrollments" },
            { icon: Globe2, value: "40+", label: zh ? "国家/地区" : "Countries" },
            { icon: Star, value: "4.3", label: zh ? "平均评分" : "Avg. rating" },
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
              {zh ? "开始授课" : "Start teaching"}
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
  const { t, lang } = useI18n();
  const { setView } = useApp();
  const zh = lang === "zh";

  const groups: { icon: React.ElementType; title: string; items: FaqItem[] }[] = [
    {
      icon: GraduationCap,
      title: zh ? "入门与账号" : "Getting started",
      items: [
        {
          q: zh ? "如何开始在 LearnHub 学习？" : "How do I start learning on LearnHub?",
          a: zh
            ? "浏览课程市场，使用分类、难度与排序筛选找到心仪课程。点击课程卡片查看完整大纲与讲师介绍，观看免费试听课后即可购买。"
            : "Browse the marketplace and use category, level and sort filters to find a course. Open a course page for the full curriculum and instructor bio, watch the free preview lessons, then enroll.",
        },
        {
          q: zh ? "有演示账号可以体验吗？" : "Is there a demo account I can try?",
          a: zh
            ? "登录页提供一键演示登录：学生、讲师与管理员三种角色，无需注册即可体验完整功能。"
            : "The sign-in page offers one-click demo logins for Student, Instructor and Admin roles — explore every feature without signing up.",
        },
        {
          q: zh ? "课程支持哪些语言？" : "Which languages are supported?",
          a: zh
            ? "课程为英文或中文授课（见课程详情页标注），平台界面支持 EN/中文 一键切换。"
            : "Courses are taught in English or Chinese (noted on each course page), and the interface toggles between EN and 中文 with one click.",
        },
        {
          q: zh ? "购买后能学习多久？" : "How long do I keep access after buying?",
          a: zh
            ? "终身访问。购买后课程永久保留在『我的学习』中，学习进度自动同步。"
            : "Forever. Enrolled courses stay in My Learning for life, and your progress syncs automatically.",
        },
      ],
    },
    {
      icon: Landmark,
      title: zh ? "支付与定价" : "Payments & pricing",
      items: [
        {
          q: zh ? "可以一次购买多门课程吗？" : "Can I buy several courses at once?",
          a: zh
            ? "可以。在课程页点击『加入购物车』，购物车支持批量结算，一次完成多门课程的购买。"
            : "Yes. Use “Add to cart” on any course page and check out the whole cart in a single order.",
        },
        {
          q: zh ? "如何使用优惠码？" : "How do coupons work?",
          a: zh
            ? "在购物车结算面板输入优惠码并点击应用。平台通用码对所有课程生效，课程专属码只对该课程打折，折扣立即反映在订单总额中。"
            : "Enter a code in the cart's order summary and hit Apply. Storewide coupons discount every item; course-specific coupons discount only that course. The total updates instantly.",
        },
        {
          q: zh ? "优惠码失效的原因有哪些？" : "Why might a coupon be rejected?",
          a: zh
            ? "常见原因：码不存在、已被停用、超过有效期、达到最大使用次数，或购物车中没有适用于该码的课程。"
            : "Common reasons: the code doesn't exist, was deactivated, expired, reached its usage limit, or no course in your cart is covered by it.",
        },
        {
          q: zh ? "这是真实支付吗？" : "Are these real payments?",
          a: zh
            ? "不是。LearnHub 是演示环境，不处理真实付款；所有『购买』均为演示数据，用于展示完整的交易与账本流程。"
            : "No. LearnHub is a demo environment — no real money moves. Every “purchase” is demo data that exercises the full transaction and ledger flow.",
        },
      ],
    },
    {
      icon: Award,
      title: zh ? "证书与学习成果" : "Certificates & outcomes",
      items: [
        {
          q: zh ? "如何获得结业证书？" : "How do I earn a certificate?",
          a: zh
            ? "完成课程全部课时后，播放器会显示『领取证书』。证书包含你的姓名、课程名称、完成日期与唯一编号，可打印或保存为 PDF。"
            : "Finish every lesson in a course and the player shows “Get certificate”. It carries your name, the course, completion date and a unique ID — printable or saveable as PDF.",
        },
        {
          q: zh ? "证书可以被验证吗？" : "Can the certificate be verified?",
          a: zh
            ? "每张证书都有唯一编号。作为演示项目，验证依赖该编号与课程记录的一致性；生产环境可对接注册库。"
            : "Each certificate has a unique ID. In this demo, verification relies on matching that ID against course records; a production build would add a public registry.",
        },
        {
          q: zh ? "可以评价学过的课程吗？" : "Can I review courses I've taken?",
          a: zh
            ? "可以，且仅限已购学员评价（标注『已验证学员』）。评分1–5星并附文字评价，评价直接展示在课程页。"
            : "Yes — only verified buyers can review (you'll show a “Verified learner” badge). Rate 1–5 stars with a comment; reviews appear on the course page.",
        },
      ],
    },
    {
      icon: LineChart,
      title: zh ? "讲师与收益" : "Instructors & payouts",
      items: [
        {
          q: zh ? "如何成为讲师？" : "How do I become an instructor?",
          a: zh
            ? "使用讲师账号登录后进入『课程创作中心』：填写课程信息、添加课时并发布，课程立即上架市场。"
            : "Sign in with an instructor account and open the Course Studio: fill in the details, add lessons, publish — the course goes live on the marketplace instantly.",
        },
        {
          q: zh ? "70/30 分成如何计算？" : "How is the 70/30 split computed?",
          a: zh
            ? "每笔销售按学员实付金额计算：30% 为平台佣金，70% 为讲师净收益。使用优惠码时按折后价分成，全部记录在收益账本中。"
            : "Every sale splits the amount the student actually paid: 30% platform fee, 70% instructor net. Coupons discount the paid amount first — it's all recorded in the revenue ledger.",
        },
        {
          q: zh ? "如何申请打款？" : "How do payouts work?",
          a: zh
            ? "在收益账本中点击『申请打款』，选择 PayPal、银行转账或 Stripe 并输入金额。管理员批准并标记完成后，金额从可用余额中扣除。"
            : "From the Revenue Ledger, request a payout via PayPal, bank transfer or Stripe. Once an admin approves and marks it paid, the amount leaves your available balance.",
        },
        {
          q: zh ? "讲师可以发优惠码吗？" : "Can instructors issue coupons?",
          a: zh
            ? "可以。讲师可在讲师中心为自己的课程创建专属优惠码（自定义折扣比例、次数与有效期），并在管理面板跟踪使用情况。"
            : "Yes. Instructors create course-scoped coupons in the instructor dashboard — choosing the discount, usage cap and expiry — and track redemptions.",
        },
      ],
    },
    {
      icon: Scale,
      title: zh ? "退款政策" : "Refunds",
      items: [
        {
          q: zh ? "退款政策是什么？" : "What is the refund policy?",
          a: zh
            ? "购买后 30 天内可申请退款（演示环境由管理员处理）。退款会生成负向账本条目，抵扣讲师净收益与平台佣金。"
            : "Request a refund within 30 days of purchase (admins process it in this demo). Refunds create negative ledger entries that offset instructor net earnings and the platform fee.",
        },
        {
          q: zh ? "退款后还能访问课程吗？" : "Do I keep access after a refund?",
          a: zh
            ? "退款完成后课程访问权限即被收回；如需再次学习可重新购买（可配合优惠码）。"
            : "Access is revoked once the refund completes. You can re-enroll at any time — coupons welcome.",
        },
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
