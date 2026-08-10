import { getPayload } from "payload";
import config from "../payload.config";

const run = async () => {
  const payload = await getPayload({ config });
  const draft = await payload.find({
    collection: "projects",
    where: { publishedAt: { exists: false } },
    limit: 1,
  });
  const doc = draft.docs[0];
  console.log("Testing gate on draft:", doc.slug, "| licence:", doc.mediaLicence, "| permit:", doc.trakheesiPermitNumber ?? "none");
  try {
    await payload.update({
      collection: "projects",
      id: doc.id,
      data: { publishedAt: new Date().toISOString() },
    });
    console.log("GATE FAILED — publish was allowed");
    process.exit(1);
  } catch (err: any) {
    const msg = err?.data?.errors?.[0]?.message ?? err.message;
    console.log("GATE BLOCKED as expected:", msg);
    process.exit(0);
  }
};
run();
