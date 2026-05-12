<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the GOATED. website. The following changes were made:

**New files created:**
- `app/providers.tsx` — Client-side PostHog provider (Next.js 14 App Router pattern using `posthog-js/react`)
- `lib/posthog-server.ts` — Server-side PostHog client helper using `posthog-node`

**Modified files:**
- `app/layout.tsx` — Wrapped root layout with `PHProvider` for automatic pageview tracking and client-side analytics
- `next.config.mjs` — Added `/ingest/*` reverse proxy rewrites to route PostHog requests through the app, reducing ad-blocker interference
- `components/AuthProvider.tsx` — Added `posthog.identify()` on sign-in and `posthog.reset()` on sign-out for user identity correlation
- `components/Navbar.tsx` — Added `booking_cta_clicked` event with `source` property (navbar_desktop / navbar_mobile)
- `components/ContactFooter.tsx` — Added `booking_cta_clicked`, `contact_form_submitted`, and `email_cta_clicked` events
- `components/BookingQualifier.tsx` — Added `booking_qualifier_submitted` event with description length property
- `components/BookingProvider.tsx` — Added `booking_calendar_reached` event when user advances to the Cal.com step
- `components/CaseStudyGrid.tsx` — Added `case_study_opened` (with title/category) and `portfolio_filter_applied` events
- `app/sign-in/page.tsx` — Added `sign_in_initiated` event when user clicks "Continue with Google"
- `app/explore/[role]/apply-form.tsx` — Added `job_application_submitted` event with role and is_update properties
- `app/api/booking-inquiry/route.ts` — Server-side `booking_inquiry_saved` event (distinct_id = email)
- `app/api/contact/route.ts` — Server-side `contact_submission_saved` event (distinct_id = email)
- `app/auth/callback/route.ts` — Server-side `user_authenticated` event + `posthog.identify()` with user ID and email

**Environment variables set in `.env.local`:**
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

---

## Event tracking summary

| Event | Description | File |
|-------|-------------|------|
| `booking_cta_clicked` | User clicks "Book a call" in Navbar | `components/Navbar.tsx` |
| `booking_cta_clicked` | User clicks "Book a call with us" in ContactFooter | `components/ContactFooter.tsx` |
| `booking_qualifier_submitted` | User completes the pre-booking qualifier form | `components/BookingQualifier.tsx` |
| `booking_calendar_reached` | User advances to the Cal.com calendar step | `components/BookingProvider.tsx` |
| `contact_form_submitted` | User submits the contact form | `components/ContactFooter.tsx` |
| `email_cta_clicked` | User clicks the mailto link | `components/ContactFooter.tsx` |
| `sign_in_initiated` | User clicks "Continue with Google" | `app/sign-in/page.tsx` |
| `job_application_submitted` | User submits a job application | `app/explore/[role]/apply-form.tsx` |
| `case_study_opened` | User opens a case study detail pane | `components/CaseStudyGrid.tsx` |
| `portfolio_filter_applied` | User filters portfolio by category | `components/CaseStudyGrid.tsx` |
| `booking_inquiry_saved` | Server: booking inquiry persisted to DB | `app/api/booking-inquiry/route.ts` |
| `contact_submission_saved` | Server: contact form saved to DB | `app/api/contact/route.ts` |
| `user_authenticated` | Server: OAuth callback completed | `app/auth/callback/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1574627)
- [Booking conversion funnel](/insights/0YkBPp2y) — tracks drop-off across the 3-step booking flow
- [Contact form submissions](/insights/ZqowkwkJ) — daily contact form lead volume
- [New user sign-ins](/insights/1MFQFFhi) — daily sign-in activity
- [Job applications submitted](/insights/DAogMhOg) — applications per day broken down by role
- [Portfolio case study engagement](/insights/dBNCHaEB) — case study opens broken down by category

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
