"use client";

import { useCallback, useEffect, useState } from "react";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const json = (await res.json()) as ApiResult<T>;
  if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as ApiResult<T>;
  if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data;
}

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

export function useApi<T>(path: string | null): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const d = await apiGet<T>(path);
        if (alive) {
          setData(d);
          setError(null);
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [path, tick]);

  return { data, error, loading, reload };
}
