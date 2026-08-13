import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./payload/collections/Users";
import { Media } from "./payload/collections/Media";
import { Projects } from "./payload/collections/Projects";
import { Developers } from "./payload/collections/Developers";
import { Communities } from "./payload/collections/Communities";
import { Lenders } from "./payload/collections/Lenders";
import { Agents } from "./payload/collections/Agents";
import { Articles } from "./payload/collections/Articles";
import { Leads } from "./payload/collections/Leads";
import { LeadNotes } from "./payload/collections/LeadNotes";
import { LeadTasks } from "./payload/collections/LeadTasks";
import { LeadActivity } from "./payload/collections/LeadActivity";
import { InternalProjectUniverse } from "./payload/collections/InternalProjectUniverse";
import { SiteStats } from "./payload/globals/SiteStats";
import { MortgageConstants } from "./payload/globals/MortgageConstants";
import { LegalEntity } from "./payload/globals/LegalEntity";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URI = process.env.DATABASE_URI || "file:./alcazar-dev.db";
const S3_BUCKET = process.env.S3_BUCKET;

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: " · Alcázar CMS" },
  },
  collections: [
    Projects,
    Developers,
    Communities,
    Lenders,
    Agents,
    Articles,
    Leads,
    LeadNotes,
    LeadTasks,
    LeadActivity,
    Media,
    Users,
    InternalProjectUniverse,
  ],
  globals: [SiteStats, MortgageConstants, LegalEntity],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  /*
   * One codebase, two backends. A postgres:// URI selects Postgres (Neon in
   * production); anything else falls back to the local SQLite file. Collections,
   * hooks and the publish gate are identical either way, so nothing about
   * compliance behaviour changes between environments.
   */
  db: DATABASE_URI.startsWith("postgres")
    ? postgresAdapter({ pool: { connectionString: DATABASE_URI } })
    : sqliteAdapter({ client: { url: DATABASE_URI } }),
  /*
   * Media lives on disk in dev and in S3-compatible object storage in
   * production. Vercel's filesystem is ephemeral, so uploads must go to a
   * bucket or every deploy would drop the renders.
   */
  plugins: S3_BUCKET
    ? [
        s3Storage({
          collections: { media: true },
          bucket: S3_BUCKET,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION ?? "auto",
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
            },
          },
        }),
      ]
    : [],
  sharp,
});
