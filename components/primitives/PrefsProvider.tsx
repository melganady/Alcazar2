"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CURRENCIES, type Currency } from "@/lib/currency";
import type { AreaUnit } from "@/lib/units";

/*
 * Currency + unit preferences, persisted in cookies (§9).
 * Cookies are read client-side after mount so pages stay statically
 * renderable (§10) — the server always renders the AED/sqft default.
 */

type Prefs = {
  currency: Currency;
  unit: AreaUnit;
  setCurrency: (c: Currency) => void;
  setUnit: (u: AreaUnit) => void;
};

const PrefsContext = createContext<Prefs | null>(null);

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

function persist(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("AED");
  const [unit, setUnitState] = useState<AreaUnit>("sqft");

  useEffect(() => {
    const c = readCookie("alcazar-currency");
    if (c && (CURRENCIES as readonly string[]).includes(c)) {
      setCurrencyState(c as Currency);
    }
    const u = readCookie("alcazar-unit");
    if (u === "sqft" || u === "sqm") setUnitState(u);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    persist("alcazar-currency", c);
  }, []);

  const setUnit = useCallback((u: AreaUnit) => {
    setUnitState(u);
    persist("alcazar-unit", u);
  }, []);

  return (
    <PrefsContext.Provider value={{ currency, unit, setCurrency, setUnit }}>
      {children}
    </PrefsContext.Provider>
  );
}
