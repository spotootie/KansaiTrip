
## Release 2 Pass 6 — Food & Dining
- Added reusable food index derived from itinerary place records.
- Added Food screen with city and meal-context filters.
- Added itinerary occurrence dates and reservation/booking-note indicators.
- Added Kyoto official Food & Drink reference link.
- Food data remains derived from the canonical trip/place layer so future Wanderlog updates stay synchronized.


## Release 2 Pass 8 — Trip Tools & Preparation
- Added local, browser-saved packing checklist.
- Added pre-trip preparation checklist.
- Added lodging-stage quick reference for the three accommodation bases.
- Added reservation/ticket confirmation reminders based only on supplied itinerary details.
- Preserved Dec 15–19 as intentionally open/unplanned.


## Traveler split
- The Navis: Carlos and Isay.
- Remaining group from Dec 12 onward: Georgia, Raph, and Arth.
- Dec 12 is a transition day: PR 407 returns The Navis to Manila while the remaining group continues the Osaka itinerary.


## R2-P12 — Traveler-aware itinerary

The itinerary includes a lightweight traveler lens rather than a separate group mode:
- **Everyone** — shows the shared itinerary.
- **The Navis** — Carlos + Isay; after Dec 12, only explicitly assigned Navis travel events remain visible.
- **Remaining group** — Georgia + Raph + Arth; their Osaka itinerary continues from Dec 12 onward.

Dec 12 is represented as a traveler split: PR 407 applies to The Navis, while the remaining group's Osaka activities remain intact.


## R2-P13 — Modern UI and readable typography

- Modern UI is now the default presentation.
- Existing 16-bit GBA styling remains available as an alternate UI mode.
- UI mode is persisted in localStorage.
- Typography and controls were increased for readability in both modes.
- Dark/light theme continues to work independently of the UI mode.


## R2-P13 Day Route Fix
Fixed Day Route day-selector controls so selecting a date stays in Day Route instead of jumping to Itinerary.
