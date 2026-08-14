import { Barlow, Barlow_Condensed, IBM_Plex_Sans_Arabic } from "next/font/google";

/*
 * Self-hosted via next/font (downloaded at build, served from our origin).
 * Barlow Condensed is the display face and carries the three sanctioned
 * heading weights. Barlow (text) and the Arabic face load with swap, no
 * preload. Neither Barlow family ships a variable file on Google Fonts, so
 * the weights are pinned to the ones the identity actually uses.
 */

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  variable: "--font-barlow",
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
