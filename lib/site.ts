export const SITE = {
  name: "REIN Investment",
  // One wordmark, Latin script, in both locales — the identity does not carry
  // a separate Arabic lockup, and an improvised transliteration is worse than
  // none.
  nameAr: "REIN Investment",
  domain: "rein.investments",
  compliance: {
    // Licence numbers live on the Legal entity global, not here — this is only
    // the fallback for a page rendered before that global is populated. Blank
    // rather than a placeholder: an omitted line is invisible, an invented or
    // "pending" one is read by every visitor.
    legalName: "REIN Investment",
    orn: "",
    tradeLicence: "",
    city: "Dubai, United Arab Emirates",
  },
} as const;
