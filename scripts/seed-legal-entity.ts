import { getPayload } from "payload";
import config from "../payload.config";

/**
 * Seeds the regulated identity. Licence numbers are deliberately left blank —
 * they must come from the licence holder's own records, not be invented here,
 * and the footer renders "pending" until they are entered.
 */
const run = async () => {
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: "legal-entity",
    data: {
      brandName: "REIN Investment",
      // From the trade licence supplied 2026-08-12. The licence on that
      // document EXPIRED 14/04/2023, so tradeLicenceExpiry is set and the site
      // suppresses the number until a current licence replaces it.
      licensedEntityName: "PROPERTYANA REAL ESTATE L.L.C",
      displayMode: "brand-only",
      orn: "",
      tradeLicence: "831248",
      tradeLicenceExpiry: "2023-04-14T00:00:00.000Z",
      commercialRegister: "1406430",
      chamberMembership: "319815",
      dldBrokerRegistration: "",
      address: "Office 733, Tamani Arts Offices\nAl Asayel St, Business Bay",
      city: "Dubai, United Arab Emirates",
      phone: "+971 58 582 7070",
      whatsapp: "+971585827070",
      email: "hello@rein-international.com",
    },
  });
  console.log("Legal entity seeded. ORN / trade licence left blank — enter the real numbers in /admin.");
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
