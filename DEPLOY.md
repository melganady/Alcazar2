# Deploying Alcázar

Everything below is a one-time setup. After it, `git push` deploys.

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
an Alcázar verdict — the "Our view" panel says the desk's opinion is still
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
S3_BUCKET=alcazar-media
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
NEXT_PUBLIC_SITE_URL=https://alcazar.ae
EXCLUDE_FIXTURES=true
```

`EXCLUDE_FIXTURES=true` keeps every seeded demo record — projects, lenders,
developers, consultants, articles and community statistics — off the public
site. Preflight treats a missing flag on a database holding demo content as a
blocking fault.

Run `npm run preflight` to see what is still missing before deploying.

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
password** — `alcazar-dev-2026` must not reach production.

## 7. Still owed on every published project

The listings are live; these are what each is still missing. `npm run
validate:projects` prints the per-project list.

- **Trakheesi permit number** — the one with a regulatory deadline attached
- An Alcázar verdict — our own written view, not the developer's copy
- Handover quarter and year where the feed left them blank (14 of 49)

Media licence is already recorded on all 49 from the Reelly contract.
