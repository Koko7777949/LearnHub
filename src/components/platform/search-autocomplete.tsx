"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n, trCategory } from "@/lib/i18n";
import { useApp } from "@/store/app";
import { Search, Star, Users, CornerDownLeft, TrendingUp } from "lucide-react";
import type { SuggestCourse } from "@/lib/types";

/**
 * Coursera-style instant search: type-ahead suggestions while the user types.
 *
 * - Full course catalog is fetched once (module-level cache shared by every
 *   header instance) and filtered client-side, so suggestions appear with zero
 *   network latency on every keystroke.
 * - Debounced (120 ms) highlight + rank: title match > instructor > category.
 * - Full keyboard support: ↑/↓ move, Enter opens, Esc closes.
 */

let catalogCache: SuggestCourse[] | null = null;
let catalogPromise: Promise<SuggestCourse[]> | null = null;

function loadCatalog(): Promise<SuggestCourse[]> {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (!catalogPromise) {
    catalogPromise = fetch("/api/courses?sort=popular")
      .then((r) => r.json())
      .then((d: { courses: SuggestCourse[] }) => {
        catalogCache = d.courses || [];
        return catalogCache;
      })
      .catch(() => {
        catalogPromise = null;
        return [] as SuggestCourse[];
      });
  }
  return catalogPromise;
}

function toEmbedUrl(url: string): string | null {
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}
// (re-exported for the player)
export { toEmbedUrl };

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-indigo-100 px-0.5 font-semibold text-indigo-900">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function MiniCover({ gradient, category }: { gradient: string; category: string }) {
  const icon = { Development: "💻", Design: "🎨", "Data Science": "📊", Marketing: "📈", Business: "💼", "IT & Software": "☁️" } as Record<string, string>;
  return (
    <span
      className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-lg ${gradient}`}
      aria-hidden
    >
      {icon[category] ?? "🎓"}
    </span>
  );
}

export function SearchAutocomplete({ onSearch }: { onSearch: (q: string) => void }) {
  const { t, lang } = useI18n();
  const { openCourse } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<SuggestCourse[] | null>(null);
  const [active, setActive] = useState(-1); // -1 = none, 0..n-1 courses, n = footer row
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  // load catalog lazily on first interaction
  useEffect(() => {
    if (open && !catalog) {
      loadCatalog().then(setCatalog);
    }
  }, [open, catalog]);

  // debounce the query for filtering
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 120);
    return () => clearTimeout(id);
  }, [q]);

  // click-outside closes
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const results = useMemo(() => {
    if (!catalog || debouncedQ.length < 2) return [] as SuggestCourse[];
    const needle = debouncedQ.toLowerCase();
    const scored = catalog
      .map((c) => {
        const title = c.title.toLowerCase();
        const inst = c.instructor.name.toLowerCase();
        const cat = c.category.toLowerCase();
        const sub = c.subtitle.toLowerCase();
        let score = -1;
        if (title.startsWith(needle)) score = 100;
        else if (title.includes(needle)) score = 80;
        else if (inst.includes(needle)) score = 60;
        else if (cat.includes(needle)) score = 50;
        else if (sub.includes(needle)) score = 30;
        if (score >= 0) score += Math.min(c.studentsCount / 2000, 20); // popularity tiebreak
        return { c, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    return scored.map((x) => x.c);
  }, [catalog, debouncedQ]);

  const showPanel = open && debouncedQ.length >= 2;
  const hasResults = results.length > 0;

  function selectCourse(c: SuggestCourse) {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    openCourse(c.id);
  }

  function runFullSearch() {
    setOpen(false);
    inputRef.current?.blur();
    onSearch(debouncedQ || q.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!showPanel) return;
    const rows = hasResults ? results.length + 1 : 1; // + footer "see all"
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % rows);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + rows) % rows);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hasResults && active >= 0 && active < results.length) {
        selectCourse(results[active]);
      } else {
        runFullSearch();
      }
    }
  }

  return (
    <div ref={boxRef} className="relative ml-auto hidden w-full max-w-md md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        role="combobox"
        aria-expanded={showPanel}
        aria-autocomplete="list"
        aria-controls="search-suggest-list"
        className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />

      {showPanel && (
        <div
          id="search-suggest-list"
          role="listbox"
          className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
        >
          {hasResults ? (
            <ul className="max-h-[22rem] overflow-y-auto py-1.5">
              {results.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => selectCourse(c)}
                    className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition ${
                      i === active ? "bg-indigo-50" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <MiniCover gradient={c.coverGradient} category={c.category} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        <Highlighted text={c.title} query={debouncedQ} />
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="truncate">{c.instructor.name}</span>·
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          {c.rating.toFixed(1)}
                          <span className="text-slate-400">({c.ratingCount.toLocaleString(lang === "zh" ? "zh-CN" : "en-US")})</span>
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {c.studentsCount.toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                        {trCategory(c.category, lang)} · {c.subtitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-slate-900">${c.price.toFixed(2)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 text-center text-sm text-slate-500">
              <Search className="mx-auto mb-1.5 h-5 w-5 text-slate-300" />
              {t("searchNoMatches").replace("{q}", debouncedQ)}
            </div>
          )}

          <button
            type="button"
            onMouseEnter={() => setActive(hasResults ? results.length : 0)}
            onClick={runFullSearch}
            className={`flex w-full items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm font-semibold transition ${
              active === (hasResults ? results.length : 0) ? "bg-indigo-50 text-indigo-700" : "bg-slate-50/60 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {hasResults ? <TrendingUp className="h-3.5 w-3.5" /> : null}
              {t("searchSeeAll").replace("{q}", debouncedQ)}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-normal text-slate-400">
              <CornerDownLeft className="h-3 w-3" /> Enter
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
