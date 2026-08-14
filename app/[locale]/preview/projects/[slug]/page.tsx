import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import ProjectPage from "../../../projects/[slug]/page";

/**
 * Authenticated staff preview of an unpublished project.
 *
 * Imported projects are drafts until a Trakheesi permit is attached, so they
 * 404 publicly — a project without a permit may not be advertised. This route
 * lets the team review the page exactly as it will look, behind Payload auth,
 * and is noindex + dynamic so it can never be crawled or cached publicly.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) notFound();

  return (
    <>
      <div className="border-b border-rule bg-steel/25">
        <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <p className="type-eyebrow text-navy">
            Draft preview · not public · signed in as {user.email}
          </p>
          <p className="type-micro text-navy/80">
            Publishing requires a Trakheesi permit number on this project.
          </p>
        </div>
      </div>
      <ProjectPage params={params} preview />
    </>
  );
}
