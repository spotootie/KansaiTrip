#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "trip.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(root, "data", "trip-schema.json"), "utf8"));
const errors = [];
const iso = /^\d{4}-\d{2}-\d{2}$/;
for (const key of meta.requiredTopLevel) if (!(key in data)) errors.push(`Missing top-level key: ${key}`);
for (const key of meta.tripRequired) if (!(key in data.trip)) errors.push(`Missing trip.${key}`);
const placeIds = new Set();
for (const p of data.places ?? []) {
  for (const key of meta.placeRequired) if (!(key in p)) errors.push(`Place missing ${key}: ${p.id ?? "unknown"}`);
  if (placeIds.has(p.id)) errors.push(`Duplicate place id: ${p.id}`);
  placeIds.add(p.id);
}
const dates = new Set();
for (const part of data.parts ?? []) {
  const partDates = new Set();
  for (const key of meta.partRequired) if (!(key in part)) errors.push(`Part missing ${key}: ${part.id ?? "unknown"}`);
  for (const day of part.days ?? []) {
    for (const key of meta.dayRequired) if (!(key in day)) errors.push(`Day missing ${key}: ${part.id}/${day.date ?? "unknown"}`);
    if (!iso.test(day.date ?? "")) errors.push(`Invalid date: ${day.date}`);
    if (partDates.has(day.date)) errors.push(`Duplicate itinerary date within ${part.id}: ${day.date}`);
    partDates.add(day.date);
    dates.add(day.date);
    for (const stop of day.stops ?? []) {
      for (const key of meta.stopRequired) if (!(key in stop)) errors.push(`Stop missing ${key}: ${day.date}`);
    }
  }
}
if (errors.length) {
  console.error("Trip data validation FAILED");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`Trip data validation passed: ${dates.size} distinct itinerary dates across ${data.parts.length} parts, ${placeIds.size} places.`);
