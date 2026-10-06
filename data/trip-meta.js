export const tripMeta = {
  schemaVersion: "1.0",
  appDataVersion: "r2-p12",
  tripId: "kansai-adventure-2026",
  lastUpdated: "2026-10-06",
  lastUpdateLabel: "Release 2 · Pass 12 — Offline PWA",
  timezone: "Asia/Tokyo",
  sources: [
    {
      id: "wanderlog-supplied-itinerary",
      type: "wanderlog-or-user-supplied-itinerary",
      label: "Supplied Wanderlog / itinerary details",
      role: "primary itinerary source"
    }
  ],
  updatePolicy: {
    preserveUnchangedData: true,
    preserveExplicitOpenDays: true,
    neverInventMissingPlans: true,
    requireChangeLogEntry: true
  }
};
