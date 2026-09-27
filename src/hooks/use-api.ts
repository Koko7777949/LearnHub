"use client";

import { useCallback, useEffect, useState } from "react";

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [url, load]);

  return { data, loading, error, refetch: load };
}

export async function apiPost<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T | null; status: number }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: T | null = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { ok: res.ok, data, status: res.status };
}

export async function apiPatch<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T | null; status: number }> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: T | null = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { ok: res.ok, data, status: res.status };
}
