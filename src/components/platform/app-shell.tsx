"use client";

import React, { useState } from "react";
import { useApp } from "@/store/app";
import { useI18n } from "@/lib/i18n";
import { Avatar } from "@/components/platform/ui-bits";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  BookOpen,
  CircleUserRound,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Languages,
  Home,
} from "lucide-react";
import type { DictKey } from "@/lib/i18n";
import type { View } from "@/store/app";

/* ============ logo ============ */
function Logo({ light = false }: { light?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => useApp.getState().setView("marketplace")}
      className="flex items-center gap-2.5"
      aria-label={t("appName")}
    >
      <span
        className={
          light
            ? "flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur"
            : "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm"
        }
      >
        <BookOpen className="h-4.5 w-4.5" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        Learn<span className={light ? "text-indigo-300" : "text-indigo-600"}>Hub</span>
      </span>
    </button>
  );
}

/* ============ language toggle ============ */
function LangToggle({ light = false }: { light?: boolean }) {
  const { t, setLang } = useI18n();
  const { lang } = useApp();
  return (
    <Button
      variant="outline"
      size="sm"
      className={
        light
          ? "h-9 border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          : "h-9 gap-1.5 border-slate-200 bg-white"
      }
      onClick={() => setLang(lang === "en" ? "zh" : "en")}
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      {t("switchLang")}
    </Button>
  );
}

/* ============ user menu ============ */
function UserMenu({ light = false }: { light?: boolean }) {
  const { t } = useI18n();
  const { user, logout, setView } = useApp();
  if (!user) {
    return (
      <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700" onClick={() => setView("login")}>
        {t("signIn")}
      </Button>
    );
  }
  const roleKey: DictKey =
    user.role === "ADMIN" ? "roleAdmin" : user.role === "INSTRUCTOR" ? "roleInstructor" : "roleStudent";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full ring-offset-2 ring-white/20 focus:outline-none focus-visible:ring-2" aria-label={user.name}>
          <Avatar name={user.name} color={user.avatarColor} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs font-normal text-muted-foreground">
            {user.email} · {t(roleKey)}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "STUDENT" && (
          <DropdownMenuItem onClick={() => setView("student")}>
            <GraduationCap className="h-4 w-4" /> {t("navMyLearning")}
          </DropdownMenuItem>
        )}
        {user.role === "INSTRUCTOR" && (
          <>
            <DropdownMenuItem onClick={() => setView("instructor")}>
              <LayoutDashboard className="h-4 w-4" /> {t("navInstructor")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView("ledger")}>
              <LineChart className="h-4 w-4" /> {t("navLedger")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView("student")}>
              <GraduationCap className="h-4 w-4" /> {t("navMyLearning")}
            </DropdownMenuItem>
          </>
        )}
        {user.role === "ADMIN" && (
          <DropdownMenuItem onClick={() => setView("admin")}>
            <ShieldCheck className="h-4 w-4" /> {t("navAdmin")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => setView("profile")}>
          <CircleUserRound className="h-4 w-4" /> {t("navProfile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
          <LogOut className="h-4 w-4" /> {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============ cart button ============ */
function CartButton() {
  const { t } = useI18n();
  const { cart, setView, view } = useApp();
  const count = cart.length;
  const active = view === "cart";
  return (
    <button
      type="button"
      onClick={() => setView("cart")}
      aria-label={`${t("cartTitle")}${count ? ` (${count})` : ""}`}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      <ShoppingCart className="h-4.5 w-4.5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

/* ============ storefront top bar ============ */
export function TopHeader({ onSearch }: { onSearch?: (q: string) => void }) {
  const { t } = useI18n();
  const { user, setView, view } = useApp();
  const [q, setQ] = useState("");

  const navBtn = (label: string, v: View, active: boolean) => (
    <button
      key={v}
      type="button"
      onClick={() => setView(v)}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {navBtn(t("navMarketplace"), "marketplace", view === "marketplace" || view === "course-detail")}
          {user?.role === "STUDENT" && navBtn(t("navMyLearning"), "student", view === "student")}
          {user?.role === "INSTRUCTOR" && (
            <>
              {navBtn(t("navInstructor"), "instructor", view === "instructor")}
              {navBtn(t("navLedger"), "ledger", view === "ledger")}
            </>
          )}
          {user?.role === "ADMIN" && navBtn(t("navAdmin"), "admin", view === "admin")}
        </div>
        {onSearch ? (
          <form
            className="ml-auto hidden max-w-md flex-1 items-center md:flex"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(q);
            }}
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                aria-label={t("search")}
              />
            </div>
          </form>
        ) : (
          <div className="ml-auto" />
        )}
        <div className="flex items-center gap-2">
          <CartButton />
          <LangToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/* ============ dashboard dark sidebar ============ */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { user, view, setView } = useApp();
  if (!user) return null;

  const items: { key: string; label: DictKey; icon: React.ElementType; v: View }[] = [
    { key: "marketplace", label: "navMarketplace", icon: Home, v: "marketplace" },
  ];
  if (user.role === "STUDENT" || user.role === "INSTRUCTOR") {
    items.push({ key: "student", label: "navMyLearning", icon: GraduationCap, v: "student" });
  }
  if (user.role === "INSTRUCTOR") {
    items.push({ key: "studio", label: "navCreateCourse", icon: Plus, v: "studio" });
    items.push({ key: "instructor", label: "navInstructor", icon: LayoutDashboard, v: "instructor" });
    items.push({ key: "ledger", label: "navLedger", icon: LineChart, v: "ledger" });
  }
  if (user.role === "ADMIN") {
    items.push({ key: "admin", label: "navAdmin", icon: ShieldCheck, v: "admin" });
  }
  items.push({ key: "profile", label: "navProfile", icon: CircleUserRound, v: "profile" });

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Dashboard navigation">
      {items.map((item) => {
        const active = view === item.v;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setView(item.v);
              onNavigate?.();
            }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span className="truncate">{t(item.label)}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const { user, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo light />
      </div>
      <SidebarNav onNavigate={() => setMobileOpen(false)} />
      <div className="mt-auto border-t border-white/10 p-3">
        {user && (
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar name={user.name} color={user.avatarColor} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label={t("logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-2 pb-1 pt-2">
          <LangToggle light />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-950 lg:flex" aria-label="Sidebar">
        {sidebarInner}
      </aside>

      {/* mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-slate-800 bg-slate-950 p-0 [&>button]:text-white">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {sidebarInner}
          </SheetContent>
        </Sheet>
        <Logo light />
        <div className="ml-auto flex items-center gap-2">
          <LangToggle light />
          {user && <Avatar name={user.name} color={user.avatarColor} size="sm" />}
        </div>
      </div>

      {/* main */}
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md lg:top-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h1>
              {subtitle ? <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

/* ============ storefront footer ============ */
export function SiteFooter() {
  const { t } = useI18n();
  const { setView } = useApp();

  const col = (title: string, links: { label: string; action: () => void }[]) => (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <button
              type="button"
              onClick={l.action}
              className="text-sm text-slate-600 transition hover:text-indigo-700"
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        {/* brand column */}
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">{t("footerTagline")}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            {t("footerSplitBadge")}
          </div>
        </div>

        {col(
          t("footerExplore"),
          [
            { label: t("navMarketplace"), action: () => setView("marketplace") },
            { label: t("navMyLearning"), action: () => setView("student") },
            { label: t("cartTitle"), action: () => setView("cart") },
            { label: t("wishlist"), action: () => setView("student") },
          ],
        )}

        {col(
          t("footerCompany"),
          [
            { label: t("footerAbout"), action: () => setView("about") },
            { label: t("footerFaq"), action: () => setView("faq") },
            { label: t("footerTeach"), action: () => setView("login") },
          ],
        )}

        {col(
          t("footerTrust"),
          [
            { label: t("refundPolicy"), action: () => setView("faq") },
            { label: t("certificate"), action: () => setView("faq") },
            { label: t("switchLang"), action: () => setView("marketplace") },
          ],
        )}
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} LearnHub. {t("footerRights")}</p>
          <p className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
            {t("footerMadeWith")}
          </p>
        </div>
      </div>
    </footer>
  );
}
