"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

/** Success note after the lead form redirect (?sent=1). Client-side so the page stays SSG. */
export function SentBanner({ consultant }: { consultant: string }) {
  const params = useSearchParams();
  const t = useTranslations("project");
  if (params.get("sent") !== "1") return null;
  return (
    <p role="status" className="type-body border border-navy/40 bg-surface p-4 text-navy">
      {t("formSent", { consultant })}
    </p>
  );
}
