import type { Lang } from "./types";

export function fmtMoney(n: number, opts: { compact?: boolean; sign?: boolean } = {}) {
  const abs = Math.abs(n);
  const prefix = opts.sign && n > 0 ? "+" : n < 0 ? "-" : "";
  if (opts.compact && abs >= 1000) {
    const v = abs >= 1000000 ? abs / 1000000 : abs / 1000;
    const suf = abs >= 1000000 ? "M" : "K";
    return `${prefix}$${v.toFixed(v >= 100 ? 0 : 1)}${suf}`;
  }
  return `${prefix}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtMoneyShort(n: number) {
  const abs = Math.abs(n);
  const prefix = n < 0 ? "-" : "";
  if (abs >= 10000) return `${prefix}$${(abs / 1000).toFixed(1)}K`;
  return `${prefix}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function fmtDate(iso: string | Date, lang: Lang = "en") {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(iso: string | Date, lang: Lang = "en") {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtMonth(iso: string, lang: Lang = "en") {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { month: "short" });
}

export function fmtDuration(minutes: number, lang: Lang = "en") {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === "zh") return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function fmtNumber(n: number) {
  return n.toLocaleString("en-US");
}

// gradient map for avatars
export const avatarGradients: Record<string, string> = {
  indigo: "from-indigo-400 to-violet-500",
  violet: "from-violet-400 to-purple-500",
  blue: "from-blue-400 to-indigo-500",
  teal: "from-teal-400 to-cyan-500",
  emerald: "from-emerald-400 to-green-500",
  rose: "from-rose-400 to-pink-500",
  pink: "from-pink-400 to-fuchsia-500",
  cyan: "from-cyan-400 to-sky-500",
  orange: "from-orange-400 to-amber-500",
  amber: "from-amber-400 to-yellow-500",
  lime: "from-lime-400 to-green-500",
  fuchsia: "from-fuchsia-400 to-purple-500",
  sky: "from-sky-400 to-blue-500",
  purple: "from-purple-400 to-violet-500",
  red: "from-red-400 to-rose-500",
  green: "from-green-400 to-emerald-500",
  slate: "from-slate-500 to-slate-700",
};

export function avatarGradient(color: string | undefined) {
  return avatarGradients[color || "indigo"] || avatarGradients.indigo;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
