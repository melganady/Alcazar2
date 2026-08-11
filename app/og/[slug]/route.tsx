import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/projects";
import { formatHandoverOrDash } from "@/lib/format";
import type { Developer } from "@/payload-types";

export const runtime = "nodejs";

const size = { width: 1200, height: 630 };

/**
 * §10 — per-project OG image in brand: frost white field, iron grey wordmark,
 * project name in display type, key facts strip. Token values are inlined because
 * @vercel/og renders in an isolated context with no stylesheet.
 */
const IRON = "#3F4244";
const ASH = "#D7D1C6";
const FROST = "#F7F7F5";
const RULE = "#D7D1C6";

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
            background: FROST,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: IRON,
            fontSize: 72,
            letterSpacing: "0.2em",
          }}
        >
          ALCÁZAR
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
          background: FROST,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: IRON, fontSize: 30, letterSpacing: "0.2em" }}>ALCÁZAR</div>
          {project.alcazarStatus === "shortlisted" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                background: IRON,
                color: ASH,
                fontSize: 24,
              }}
            >
              Á
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ color: IRON, opacity: 0.8, fontSize: 20, letterSpacing: "0.28em" }}>
            {`${project.subCommunity.toUpperCase()}, ${project.emirate.toUpperCase()}`}
          </div>
          <div
            style={{
              color: IRON,
              fontSize: project.name.length > 24 ? 62 : 78,
              letterSpacing: "0.06em",
              lineHeight: 1.1,
            }}
          >
            {project.name.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", borderTop: `1px solid ${RULE}`, paddingTop: 24, gap: 56 }}>
          {facts.map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: IRON, opacity: 0.8, fontSize: 15, letterSpacing: "0.2em" }}>
                {label.toUpperCase()}
              </div>
              <div style={{ color: IRON, fontSize: 26 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
