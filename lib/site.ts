export const SITE = {
  name: "Alcázar",
  nameAr: "القصر",
  domain: "alcazar.ae",
  compliance: {
    // Licence numbers live on the Legal entity global, not here — this is only
    // the fallback for a page rendered before that global is populated. Blank
    // rather than a placeholder: an omitted line is invisible, an invented or
    // "pending" one is read by every visitor.
    legalName: "Alcázar",
    orn: "",
    tradeLicence: "",
    city: "Dubai, United Arab Emirates",
  },
} as const;
