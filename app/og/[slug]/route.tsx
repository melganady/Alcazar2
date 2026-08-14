import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/projects";
import { formatHandoverOrDash } from "@/lib/format";
import type { Developer } from "@/payload-types";

export const runtime = "nodejs";

const size = { width: 1200, height: 630 };

/**
 * §10 — per-project OG image in brand: navy field, the supplied wordmark
 * reversed out of it, project name in display type, key facts strip. Token
 * values are inlined because @vercel/og renders in an isolated context with
 * no stylesheet.
 */
const NAVY = "#050A30";
const CHALK = "#F7F7F8";
const STEEL = "#5980A6";
const HAIRLINE = "rgba(247,247,248,0.22)";

/*
 * The wordmark is supplied artwork and is never re-typed, so it is read off
 * disk and inlined as a data URL rather than set in a webfont. Read once at
 * module scope: the file ships with the build and never changes at runtime.
 */
const wordmark = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/brand/wordmark-white.png"),
).toString("base64")}`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: NAVY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmark} alt="REIN Investment" width={520} />
        </div>
      ),
      size,
    );
  }

  const developer =
    project.developer && typeof project.developer === "object"
      ? (project.developer as Developer).name
      : "";

  const facts = [
    ["From", `AED ${project.priceFromAED.toLocaleString("en-AE")}`],
    ["Plan", project.paymentPlan?.label ?? "—"],
    ["Handover", formatHandoverOrDash(project.handoverQuarter, project.handoverYear)],
    ["Developer", developer || "—"],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: NAVY,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmark} alt="REIN Investment" width={190} />
          {project.alcazarStatus === "shortlisted" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 15,
                letterSpacing: "0.16em",
                color: CHALK,
                border: `1px solid ${HAIRLINE}`,
                padding: "8px 14px",
              }}
            >
              SHORTLISTED
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: STEEL, fontSize: 20, letterSpacing: "0.16em" }}>
            {`${project.subCommunity.toUpperCase()}, ${project.region.toUpperCase()}`}
          </div>
          <div
            style={{
              color: CHALK,
              fontSize: project.name.length > 24 ? 66 : 84,
              lineHeight: 1.02,
            }}
          >
            {project.name}
          </div>
        </div>

        <div style={{ display: "flex", borderTop: `1px solid ${HAIRLINE}`, paddingTop: 24, gap: 56 }}>
          {facts.map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: STEEL, fontSize: 15, letterSpacing: "0.16em" }}>
                {label.toUpperCase()}
              </div>
              <div style={{ color: CHALK, fontSize: 26 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
