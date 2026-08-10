import { Jost, Montserrat, IBM_Plex_Sans_Arabic } from "next/font/google";

/*
 * Self-hosted via next/font (downloaded at build, served from our origin).
 * Jost is the display face and is preloaded as a single variable file —
 * this satisfies "preload the two display weights only" with one request.
 * Montserrat (text) and the Arabic face load with swap, no preload.
 */

export const jost = Jost({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jost",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

// The one permitted exception to "two fonts" — ar locale display type (§9).
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500"],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});
