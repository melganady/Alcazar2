"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type CompareItem = { slug: string; name: string };

const CompareContext = createContext<{
  items: CompareItem[];
  toggle: (item: CompareItem) => void;
  clear: () => void;
  has: (slug: string) => boolean;
} | null>(null);

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}

const KEY = "alcazar-compare";
export const COMPARE_MAX = 3;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const persist = (next: CompareItem[]) => {
    setItems(next);
    sessionStorage.setItem(KEY, JSON.stringify(next));
  };

  const toggle = useCallback(
    (item: CompareItem) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.slug === item.slug);
        const next = exists
          ? prev.filter((i) => i.slug !== item.slug)
          : prev.length >= COMPARE_MAX
            ? prev
            : [...prev, item];
        sessionStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => persist([]), []);
  const has = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items],
  );

  return (
    <CompareContext.Provider value={{ items, toggle, clear, has }}>
      {children}
    </CompareContext.Provider>
  );
}
