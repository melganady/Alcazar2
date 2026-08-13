# Alcázar CRM

Internal tool at `/crm` for managing leads and (via links to `/admin`) the
listings that generate them. Same login as the Payload admin — there is one
set of team accounts, not two.

## Logging in

Go to `yourdomain.com/crm`. You'll be redirected to `/crm/login` if you're
not signed in. Use the same email/password as `/admin`.

The very first admin account (the one that already existed before the CRM
shipped) needs its role set once: open `/admin` → Users → that user → set
**Role** to Admin, and save. Every account created afterwards through
`/crm/team` already has a role from the start.

## Roles

**Admin** — sees every lead, can reassign any lead, publishes/unpublishes
listings (via `/admin`), and manages the team at `/crm/team`.

**Agent** — sees leads assigned to them, plus unassigned ones in the New
queue (so there's something to claim). Can't see or edit a colleague's
assigned lead, and can't reach `/crm/team` or `/admin`'s Users collection.

## Adding a project or listing

Off-plan projects and secondary (completed) listings are both managed in
one place: `/admin` → Projects. The CRM doesn't duplicate this screen — it
already has image upload, the publish gate (a listing can't go live missing
its Trakheesi permit, verdict, developer, etc.), and computed fields like
yield and price/sqft. Publishing there revalidates the live pages
immediately.

Developers and Communities work the same way: manage them at `/admin`, they
show up automatically wherever a project references them.

## How leads work

Every "register interest" action on the public site (a project page, a
secondary listing, the mortgage calculator, the contact form) writes a
`Lead` and starts it in the **New** stage, unassigned.

The pipeline is: New → Contacted → Qualified → Viewing scheduled → Offer
made → Closed won / Closed lost. It's hardcoded for v1 — making it
admin-editable is a small, contained change (swap the fixed list in
`payload/collections/crmShared.ts` for a `pipeline-stages` collection) but
wasn't worth building before there's a second stage list to justify it.

From `/crm/leads` you can filter by stage, agent, market and view either a
table or a kanban board. Dragging a card between kanban columns moves the
stage on desktop; every card and table row also has a plain dropdown, which
is what phones, keyboards and screen readers actually use.

Open a lead to see its contact details, add notes, create follow-up tasks,
reassign it, and read the activity feed — stage changes, (re)assignments,
notes and tasks all log themselves there automatically.

## Notifications

The moment a lead is created, an email goes out to the team via the
existing Resend adapter (`lib/notifications`), with a link straight to that
lead's `/crm` page. Recipients come from `CRM_ALERT_EMAILS` (comma-separated)
— without it set, the alert just logs to the console, so nothing breaks in
dev but nobody gets notified in production until it's set.

Slack and WhatsApp weren't wired up for v1 (email was the confirmed
channel). Adding either later means implementing the same small
`InternalAlertAdapter` interface in `lib/notifications/index.ts` that the
email adapter already implements, and switching `getInternalAlertAdapter()`
to prefer it when the relevant env var is set — the same pattern
`lib/email` and `lib/crm` already use for their own adapters.

## Adding a new team member

Admins only: go to `/crm/team`, fill in name, email and a temporary
password (8+ characters), pick a role, and share the password with them
directly — not by email, since it isn't sent anywhere automatically. They
can log in immediately at `/crm/login`.

## What's deliberately not built

- **Projects/Listings/Developers/Communities CRUD inside `/crm`** — `/admin`
  already does this well; duplicating it would mean keeping two forms in
  sync with the publish gate. `/crm` links out instead.
- **Configurable pipeline stages** — hardcoded list, noted above.
- **Slack/WhatsApp alerts** — email only for v1; see Notifications.
- **Fine-grained access on Notes/Tasks/Activity** — any signed-in team
  member can read/edit any note or task by direct ID (not just the lead's
  assigned agent); the real boundary is on the Lead itself, which an agent
  can't discover outside their own queue. Tightening this further is a
  fast-follow, not a v1 blocker.

## Environment variables to provision

Already required by the site before the CRM existed:
`PAYLOAD_SECRET`, `DATABASE_URI`, `NEXT_PUBLIC_SITE_URL`, the `S3_*` media
vars, `RESEND_API_KEY` + `EMAIL_FROM`.

New for the CRM:

```
CRM_ALERT_EMAILS=agent1@alcazar.ae,agent2@alcazar.ae
```

Comma-separated. That's the only new environment variable — no new
accounts, no new services. If it's already set for the autoresponder,
`RESEND_API_KEY` doesn't need to be added again.
