# Deploying REIN Investment

Everything below is a one-time setup.

## The short version

Three accounts, then four commands. Each account step needs a browser and a
password, so they are yours to do; everything after is scripted.

**1. Neon** — neon.tech, create a project, copy the *pooled* connection string.

**2. Cloudflare R2** — create a bucket named `rein-media`, then an API token
with Object Read & Write. Note the bucket name, account endpoint, access key
and secret. R2 has no egress fees, which matters for 1.2 GB of renders.

**3. Vercel** — an account is enough; the CLI creates the project. No GitHub
repository is needed, the CLI uploads the working directory directly.

Then, from the project root:

```bash
npx vercel login
```

```bash
npx vercel link
```

Add the environment below in the Vercel dashboard (Settings → Environment
Variables), or with `npx vercel env add <NAME> production` for each. The
`PAYLOAD_SECRET` has already been generated for you — it is in
`.env.production.local`, which is gitignored and never committed.

```
PAYLOAD_SECRET=<from .env.production.local>
DATABASE_URI=<Neon pooled connection string>
NEXT_PUBLIC_SITE_URL=https://<your domain>
EXCLUDE_FIXTURES=true
ALLOW_INCOMPLETE_PUBLISH=true
S3_BUCKET=rein-media
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=<R2 key>
S3_SECRET_ACCESS_KEY=<R2 secret>
```

Fill the bucket and the database, then ship:

```bash
S3_BUCKET=rein-media S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com S3_ACCESS_KEY_ID=<key> S3_SECRET_ACCESS_KEY=<secret> npm run upload:media
```

```bash
DATABASE_URI=<Neon string> PAYLOAD_SECRET=<secret> npm run seed:legal && DATABASE_URI=<Neon string> PAYLOAD_SECRET=<secret> npm run seed:mortgage
```

```bash
DATABASE_URI=<Neon string> PAYLOAD_SECRET=<secret> npm run reelly:all -- --contract-ref <your Reelly agreement ref>
```

```bash
DATABASE_URI=<Neon string> PAYLOAD_SECRET=<secret> ALLOW_INCOMPLETE_PUBLISH=true npm run publish:all
```

```bash
npx vercel --prod
```

Run `npm run preflight` with the production environment first — it refuses to
pass on a missing secret, a non-Postgres URI, or demo content that would be
served, and reports how many live listings still lack a Trakheesi permit.

### Two things worth knowing before you start

**Postgres has been rehearsed, not proven on Neon.** The app was built on
SQLite, so the Postgres path was exercised against an in-process Postgres 16
before writing this: Payload created the whole schema on first boot, writes
and relationship population worked across the join tables, the publish gate
refused an incomplete record and then passed it under
`ALLOW_INCOMPLETE_PUBLISH`, the fixture guard hid a flagged record from public
reads and degraded a flagged relation to a bare id, and every page rendered
with no errors in the log. Neon is a managed service with its own pooling, so
run this against it before the first deploy:

```bash
DATABASE_URI=<neon string> PAYLOAD_SECRET=<secret> npm run db:smoke
```

It writes two throwaway `probe-*` records, checks the above, and deletes them.
Safe against a live database and safe to re-run.

**Media is no longer in the repository.** It was 2013 files and 1.2 GB, which
is past what a deployment bundle should carry. The files are still on disk
locally and `npm run upload:media` puts them in the bucket. The 1.2 GB is
still in git *history*; if you ever push this to GitHub it goes too. Say the
word and I will rewrite the history to drop it — that is destructive, so I
have not done it.

## What goes live today

The full site: 49 projects with licensed photography, 48 developer profiles,
25 area pages, the mortgage calculator and guides, careers, contact and the
legal pages.

**The 49 listings are advertised without Trakheesi permits.** This was an
explicit instruction, and the exposure is the operator's: §11.1 requires a
permit number on any advert for a specific Dubai property, and the penalty
falls on the licence holder, not on the site. The gate that would otherwise
block them is not deleted — it still evaluates every record and logs what is
missing — but `ALLOW_INCOMPLETE_PUBLISH=true` lets those gaps through:

```
ALLOW_INCOMPLETE_PUBLISH=true    # remove this and the gate blocks again
```

`npm run preflight` reports how many live listings lack a permit every time it
runs. Entering permit numbers at `/admin` clears them one by one; unsetting
the flag holds everything as drafts again.

Two gaps the flag also lets through, both visible on the pages themselves:
14 of 49 have no handover date from the feed and render "—", and none carries
a REIN Investment verdict — the "Our view" panel says the desk's opinion is still
being written rather than inventing one. Verdicts are never auto-generated.

**No demo content goes live.** The development database is seeded with content
that reads as real and is not: five invented banks quoting LTVs and rates,
eight invented developers with delivery statistics, four named consultants
with BRNs, three placeholder articles, and price-per-sqft figures on ten real
communities. On a licensed brokerage's site any of it would be a
misrepresentation. Every seeded record carries `isFixture`, a read-time hook
withholds them from the public site whenever `EXCLUDE_FIXTURES=true`, the
seeder refuses to run against a Postgres database, and `npm run preflight`
blocks a deploy that would serve them. **Set `EXCLUDE_FIXTURES=true`.**

A production database starts empty in any case, so what reaches the live site
is only what you import or write there. To populate it:

```bash
npm run reelly:all -- --contract-ref <your Reelly agreement ref>
ALLOW_INCOMPLETE_PUBLISH=true npm run publish:all
```

Real lenders, consultants and editorial have to be entered at `/admin`. There
is no seed for them, deliberately.

The footer shows "ORN pending · Trade licence pending" — the licence numbers
on file have lapsed and the site suppresses expired credentials rather than
publishing them. Enter current ones at `/admin` → Legal entity & licence and
the footer fills in with no deploy.

## 1. Database — Neon Postgres

SQLite does not survive a Vercel deploy; the filesystem is ephemeral.

1. Create a project at neon.tech, copy the pooled connection string.
2. Set `DATABASE_URI=postgres://…` in Vercel.

The Payload config picks the adapter from the URI scheme, so nothing else
changes. On first boot Payload creates the schema.

## 2. Media — S3-compatible storage

Uploads also live on the ephemeral filesystem, so renders would vanish on
redeploy. Cloudflare R2 is the cheap option (no egress fees).

```
S3_BUCKET=rein-media
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=…
S3_SECRET_ACCESS_KEY=…
```

Existing local media in `media/` must be uploaded to the bucket once, or
re-imported with `npm run reelly:all`.

## 3. Required environment

```
PAYLOAD_SECRET=<long random string — rotate the dev one>
DATABASE_URI=postgres://…
NEXT_PUBLIC_SITE_URL=https://rein-international.com
EXCLUDE_FIXTURES=true
```

`EXCLUDE_FIXTURES=true` keeps every seeded demo record — projects, lenders,
developers, consultants, articles and community statistics — off the public
site. Preflight treats a missing flag on a database holding demo content as a
blocking fault.

Run `npm run preflight` to see what is still missing before deploying.

### Custom domain — rein-international.com

`NEXT_PUBLIC_SITE_URL` is what canonical tags, `sitemap.xml`, `robots.txt` and
OG image URLs are built from. It is read at build time, so changing it needs a
redeploy, not just a restart — and until it matches the domain the site is
actually served on, search engines are told the canonical copy lives elsewhere.

In Vercel → Project → Settings → Domains, add both `rein-international.com` and
`www.rein-international.com`, then at the registrar:

| Record | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Vercel prints the exact values when the domain is added — use those if they
differ from the table. Set one of the pair as primary so the other redirects
rather than serving a duplicate. Once the certificate is issued, set
`NEXT_PUBLIC_SITE_URL=https://rein-international.com` and redeploy.

## 4. Optional — each degrades gracefully

| Variable | Without it |
|---|---|
| `REELLY_API_KEY` | no project import |
| `HUBSPOT_ACCESS_TOKEN` | leads stay in Payload, no CRM sync |
| `RESEND_API_KEY`, `EMAIL_FROM` | autoresponder logs instead of sending |
| `TURNSTILE_SECRET_KEY` | forms rely on honeypot + rate limit only |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | map view shows its placeholder |

Resend also needs DNS records on the sending domain.

## 5. Vercel

1. Import the repo, framework preset Next.js.
2. Add the environment variables above.
3. Deploy. Build command is `npm run build` (webpack, not Turbopack —
   Payload does not support Turbopack production builds on Next 15).

## 6. First run

```bash
npm run seed:legal        # address, phone, licence record
npm run seed:mortgage     # LTV caps and fees — VERIFY BEFORE RELYING ON THEM
```

Do **not** run `npm run seed` — that is the demo-content seeder, and it now
refuses to run against a Postgres database for the reasons above. If demo
content ever does reach production, `npm run mark:fixtures` flags it and
`EXCLUDE_FIXTURES=true` withholds it.

Then create an admin user at `/admin` on first visit, and **rotate the dev
password** — `rein-dev-2026` must not reach production.

## 7. Still owed on every published project

The listings are live; these are what each is still missing. `npm run
validate:projects` prints the per-project list.

- **Trakheesi permit number** — the one with a regulatory deadline attached
- A REIN Investment verdict — our own written view, not the developer's copy
- Handover quarter and year where the feed left them blank (14 of 49)

Media licence is already recorded on all 49 from the Reelly contract.
