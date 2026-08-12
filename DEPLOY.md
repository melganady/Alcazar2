# Deploying Alcázar

Everything below is a one-time setup. After it, `git push` deploys.

## What goes live today

Brand pages, the mortgage calculator and guides, insights, careers, contact
and the legal pages.

**No property adverts go live.** All 49 imported projects are drafts, and the
publish gate holds them there until each carries a Trakheesi permit number.
`/projects`, `/developers` and `/communities` will render their empty states
until then. That is the gate working, not a misconfiguration.

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

`EXCLUDE_FIXTURES=true` keeps the 40 seeded demo projects out of production.

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

Then create an admin user at `/admin` on first visit, and **rotate the dev
password** — `alcazar-dev-2026` must not reach production.

## 7. Before any project is published

Per project, in `/admin`:
- Trakheesi permit number (the gate blocks publish without it)
- An Alcázar verdict — our own written view, not the developer's copy
- Confirm media licence is recorded

`npm run validate:projects` lists what each draft still needs.
