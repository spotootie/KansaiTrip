# Kansai Adventure — Itinerary Update Workflow

This project is intentionally **data-driven**. The UI code should not need to be rewritten when the travel plan changes.

## What to send for an update

Send the latest Wanderlog link/export/PDF plus any changes you know that are not reflected there, for example:

- changed date or time
- added/removed activity
- changed restaurant or reservation
- hotel/accommodation change
- transportation change
- notes such as booking requirements
- a date that should remain intentionally open

You do **not** need to resend the entire trip explanation if the app already contains the previous version.

## Update process

1. Treat `data/trip.json` as the normalized itinerary source of truth for the app.
2. Compare the new supplied itinerary against the current data.
3. Preserve unchanged places and itinerary records.
4. Apply additions, removals, date changes, time changes, and notes.
5. Never invent activities for missing/open dates.
6. Record the update in `data/update-log.json`.
7. Update `data/trip-meta.js` and the app data version.
8. Run:

```bash
node scripts/validate-trip.mjs
```

9. Regenerate `data/trip.js` from `data/trip.json` if both files are changed manually.
10. Run the app smoke tests and package the updated GitHub ZIP.

## Source discipline

The itinerary source and educational/reference sources are separate concerns. A new Wanderlog update changes the **trip itinerary**, not automatically the factual content of attraction descriptions, fares, opening hours, or route instructions. Those should be separately verified when their feature is implemented.

## Open-day rule

If the supplied itinerary says a date is open/unplanned, retain that status. Do not fill it with guesses or generic sightseeing suggestions unless the user explicitly asks for recommendations.

## Change summaries

For every update, provide a concise change report before or alongside the new ZIP:

- Added
- Removed
- Moved/rescheduled
- Changed details
- Still open
- Unchanged

This makes repeated itinerary refreshes auditable and easy to review.
