import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
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
import { InternalProjectUniverse } from "./payload/collections/InternalProjectUniverse";
import { SiteStats } from "./payload/globals/SiteStats";
import { MortgageConstants } from "./payload/globals/MortgageConstants";
import { LegalEntity } from "./payload/globals/LegalEntity";

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
  // Dev: SQLite (no local Postgres available). Production: swap to
  // @payloadcms/db-postgres pointed at Neon — schema and hooks are identical.
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || "file:./alcazar-dev.db" },
  }),
  sharp,
});
