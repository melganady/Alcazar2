import { getPayload } from "payload";
import config from "@payload-config";

/** Local API client — Payload caches the instance per config. */
export const getPayloadClient = () => getPayload({ config });
