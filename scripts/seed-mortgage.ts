import { getPayload } from "payload";
import config from "../payload.config";
import { DEFAULT_MORTGAGE_CONSTANTS } from "../lib/mortgage/defaults";

const run = async () => {
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: "mortgage-constants",
    data: DEFAULT_MORTGAGE_CONSTANTS,
  });
  console.log("Mortgage constants seeded (marked unverified).");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
