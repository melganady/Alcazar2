"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** §12 project_view. Fires once per mount, and only with analytics consent. */
export function TrackProjectView({
  slug,
  community,
  status,
}: {
  slug: string;
  community?: string;
  status?: string;
}) {
  useEffect(() => {
    track({ name: "project_view", slug, community, status });
  }, [slug, community, status]);
  return null;
}
