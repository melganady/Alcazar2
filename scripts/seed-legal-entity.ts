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
      brandName: "Alcázar",
      licensedEntityName: "",
      displayMode: "brand-with-licence-line",
      orn: "",
      tradeLicence: "",
      dldBrokerRegistration: "",
      address: "Office 733, Tamani Arts Offices\nAl Asayel St, Business Bay",
      city: "Dubai, United Arab Emirates",
      phone: "+971 58 582 7070",
      email: "hello@alcazar.ae",
    },
  });
  console.log("Legal entity seeded. ORN / trade licence left blank — enter the real numbers in /admin.");
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
