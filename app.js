
import { tripData } from "./data/trip.js";
import { tripMeta } from "./data/trip-meta.js";
import { placeIndex } from "./data/place-index.js";
import { locationIndex } from "./data/location-index.js";
import { foodIndex } from "./data/food-index.js";
import { budgetIndex } from "./data/budget-index.js";
import { encyclopediaIndex } from "./data/encyclopedia-index.js";

const main = document.querySelector("#main");
const sidebar = document.querySelector("#sidebar");
const themeToggle = document.querySelector("#themeToggle");
const uiModeToggle = document.querySelector("#uiModeToggle");
const menuToggle = document.querySelector("#menuToggle");
const backButton = document.querySelector("#backButton");

const state = {
  view: "today",
  selectedDate: null,
  history: [],
  routeInitialized: false,
  transitFrom: "",
  transitTo: "",
  transitFromName: "",
  transitToName: "",
  travelerFilter: localStorage.getItem("kansai-traveler-filter") || "all",
};

const icons = {
  arrival:"✈️", hotel:"🏨", attraction:"🏯", food:"🍜", shopping:"🛍️",
  transit:"🚆", experience:"👘", entertainment:"🎮", choice:"🔀", transition:"🌸", flight:"✈️"
};

function getTokyoTodayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tripMeta.timezone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function tripBounds() {
  const days = allDays();
  return { first: days[0]?.date, last: days[days.length - 1]?.date };
}

function tripDayStatus(date = getTokyoTodayISO()) {
  const { first, last } = tripBounds();
  if (!first || !last) return "unknown";
  if (date < first) return "before";
  if (date > last) return "after";
  return "during";
}

function getTodayForTrip() {
  const days = allDays();
  const today = getTokyoTodayISO();
  return days.find(d => d.date === today) || days.find(d => d.date > today) || days[days.length - 1];
}

function daysUntil(date) {
  const today = new Date(`${getTokyoTodayISO()}T12:00:00`);
  const target = new Date(`${date}T12:00:00`);
  return Math.round((target - today) / 86400000);
}

function allDays() {
  return tripData.parts.flatMap(part => part.days.map(day => ({...day, partId:part.id, partTitle:part.title})));
}

function dayByDate(date) {
  return allDays().find(d => d.date === date);
}

function travelerMatchesFilter(day, filter = state.travelerFilter) {
  if (filter === "all") return true;
  const target = filter === "navis" ? "The Navis" : "Remaining group";
  const dayGroup = day.travelerGroup || "";
  if (filter === "navis" && (dayGroup === "The Navis" || dayGroup === "Group" || dayGroup.includes("The Navis"))) return true;
  if (filter === "remaining" && (dayGroup === "Group" || dayGroup === "Remaining group" || dayGroup.includes("Group"))) return true;
  return (day.stops || []).some(stop => stop.flight?.travelerGroup === target);
}

function stopMatchesTraveler(stop, day, filter = state.travelerFilter) {
  if (filter === "all") return true;
  if (stop.flight?.travelerGroup === "The Navis") return filter === "navis";
  if (day.travelerGroup === "The Navis") return filter === "navis";
  return filter === "remaining";
}

function travelerLabel(filter = state.travelerFilter) {
  return filter === "navis" ? "The Navis · Carlos + Isay" : filter === "remaining" ? "Remaining group · Georgia + Raph + Arth" : "Everyone";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday:"long", month:"long", day:"numeric"
  }).format(new Date(`${date}T12:00:00`));
}

function setView(view, {push=true, date=null, place=null} = {}) {
  if (!view) return;
  const params = new URLSearchParams(location.search);
  const currentView = params.get("view") || state.view || "today";
  const currentDate = params.get("date") || state.selectedDate || null;
  const currentPlace = params.get("place") || null;
  const nextDate = date || null;
  const nextPlace = place || null;
  const changed = view !== currentView || nextDate !== currentDate || nextPlace !== currentPlace;

  if (push && state.routeInitialized && changed) {
    state.history.push({view: currentView, date: currentDate, place: currentPlace});
    const next = new URLSearchParams();
    next.set("view", view);
    if (nextDate) next.set("date", nextDate);
    if (nextPlace) next.set("place", nextPlace);
    history.pushState({view, date: nextDate, place: nextPlace}, "", `?${next.toString()}`);
  }

  state.view = view;
  state.selectedDate = nextDate;
  render();
  main.focus({preventScroll:true});
  sidebar.classList.remove("open");
}

function stopMarkup(stop) {
  const icon = icons[stop.type] || "📍";
  const extra = stop.note ? `<div class="stop-note">${stop.note}</div>` : "";
  const alt = stop.alternative ? `<div class="stop-note">Alternative: ${stop.alternative}</div>` : "";
  const status = stop.status ? `<span class="tag">${stop.status}</span>` : "";
  const flight = stop.flight ? `<div class="stop-flight"><strong>${escapeHtml(stop.flight.airline)} ${escapeHtml(stop.flight.flightNumber)}</strong><span>${escapeHtml(stop.flight.from)} ${escapeHtml(stop.flight.departure)} → ${escapeHtml(stop.flight.to)} ${escapeHtml(stop.flight.arrival)}</span><small>${escapeHtml(stop.flight.service)} · ${escapeHtml(stop.flight.duration)} · ${escapeHtml(stop.flight.travelerGroup)}</small></div>` : "";
  const placeAction = stop.placeId ? `data-place="${stop.placeId}" role="button" tabindex="0"` : "";
  return `
    <div class="stop ${stop.placeId ? "stop-link" : ""} ${stop.flight ? "flight-stop" : ""}" ${placeAction}>
      <div class="stop-icon">${icon}</div>
      <div>
        <div class="stop-title">${escapeHtml(stop.title)}</div>
        ${extra}${alt}${flight}
      </div>
      ${status}${stop.placeId ? `<span class="stop-arrow">→</span>` : ""}
    </div>`;
}

function dayCard(day, compact=false) {
  const stops = day.stops || [];
  const open = day.status === "open";
  const travelerTags = day.travelers?.length ? `<div class="traveler-tags"><span class="tag">${escapeHtml(day.travelerGroup || "TRIP")}</span>${day.travelers.map(name => `<span class="tag">${escapeHtml(name)}</span>`).join("")}</div>` : "";
  const navisDeparture = day.navisDeparture ? `<div class="notice flight-transition"><strong>The Navis depart:</strong> Carlos and Isay return to Manila on ${escapeHtml(day.navisDeparture)}. Georgia, Raph, and Arth continue the itinerary in Japan.</div>` : "";
  return `
    <article class="card ${open ? "open-day" : ""}">
      <div class="date-strip">
        <span class="date-badge">${formatDate(day.date)}</span>
        <span class="tag">${day.city}</span>
      </div>
      <h3>${day.title}</h3>
      <p class="muted">${day.subtitle}</p>
      ${travelerTags}
      ${compact ? `<p>${open ? "No stops recorded in the supplied itinerary." : `${stops.length} planned stops`}</p>` :
        `${navisDeparture}${day.departureConflictNote ? `<div class="notice flight-conflict"><strong>Flight timing note:</strong> ${escapeHtml(day.departureConflictNote)}</div>` : ""}<div class="stop-list">${stops.map(stopMarkup).join("")}</div>`}
    </article>`;
}

function renderToday() {
  const day = getTodayForTrip();
  const today = getTokyoTodayISO();
  const status = tripDayStatus(today);
  const isActualTripDay = day.date === today;
  const countdown = daysUntil(day.date);
  const totalStops = (day.stops || []).length;
  const statusLabel = status === "during" && isActualTripDay ? "TODAY" : status === "before" ? "UP NEXT" : "TRIP DAY";
  const lead = status === "before"
    ? `Your next planned adventure is ${countdown === 1 ? "tomorrow" : `in ${countdown} days`}.`
    : status === "during" && isActualTripDay
      ? "You are on the itinerary today."
      : status === "after"
        ? "Your scheduled itinerary has finished. You can still browse the complete trip below."
        : "Your current trip day.";

  return `
    <section class="hero today-hero">
      <div class="kicker">16-BIT KANSAI ADVENTURE</div>
      <div class="hero-title-row"><div><h1>${statusLabel === "TODAY" ? "Today's Adventure" : "Next Adventure"}</h1></div><div class="hero-emblem" aria-hidden="true">🍁</div></div><div class="pixel-divider"></div>
      <p class="muted">${lead} Kyoto + Osaka • late autumn 2026</p>
      <div class="stats">
        <div class="stat"><strong>${formatDate(day.date).split(",")[0]}</strong><span>${statusLabel}</span></div>
        <div class="stat"><strong>${totalStops}</strong><span>STOPS</span></div>
        <div class="stat"><strong>${day.city}</strong><span>BASE</span></div>
      </div>
    </section>

    ${day.status === "open" ? `<div class="notice">This upcoming date is intentionally open in the supplied itinerary. No activities have been invented.</div>` : ""}

    <section class="card today-focus-card">
      <div class="section-head">
        <div><div class="kicker">${isActualTripDay ? "TODAY'S PLAN" : "UPCOMING PLAN"}</div><h2>${day.title}</h2><p class="muted">${formatDate(day.date)} · ${day.city}</p></div>
        <span class="tag">${day.status === "open" ? "OPEN" : `${totalStops} STOPS`}</span>
      </div>
      <p class="muted">${day.subtitle}</p>
      ${day.status === "open" ? `<div class="notice">No planned stops are recorded for this date.</div>` : `<div class="stop-list">${day.stops.slice(0, 5).map(stopMarkup).join("")}</div>${totalStops > 5 ? `<button class="btn secondary" data-view="itinerary" data-date="${day.date}">VIEW ALL ${totalStops} STOPS →</button>` : ""}`}
    </section>

    <section class="dashboard-overview">
      <div class="section-head"><div><div class="kicker">TRIP OVERVIEW</div><h2>At a glance</h2></div><span class="tag">2026</span></div>
      <div class="dashboard-grid">
        <div class="dashboard-card"><span class="kicker">TRIP</span><strong>Nov 30 → Dec 19</strong><span class="muted">Kyoto + Osaka</span></div>
        <div class="dashboard-card"><span class="kicker">TRAVELERS</span><strong>${travelerLabel()}</strong><span class="muted">Use the itinerary lens to change the view.</span></div>
        <div class="dashboard-card"><span class="kicker">NEXT TRANSITION</span><strong>Dec 12 · The Navis depart</strong><span class="muted">Carlos + Isay return to Manila; Georgia, Raph + Arth continue.</span></div>
        <div class="dashboard-card"><span class="kicker">OPEN DAYS</span><strong>${allDays().filter(d => d.status === "open").length}</strong><span class="muted">Dec 15–19 remain intentionally unplanned.</span></div>
      </div>
    </section>

    <div class="grid grid-3 today-actions">
      <button class="card card-button" data-view="itinerary" data-date="${day.date}"><span class="kicker">PLAN</span><h3>Open itinerary</h3><p class="muted">See every day and switch dates.</p></button>
      <button class="card card-button" data-view="dayroute" data-date="${day.date}"><span class="kicker">ROUTE</span><h3>Day Route</h3><p class="muted">See the selected day's route in order.</p></button>
      <button class="card card-button" data-view="places"><span class="kicker">EXPLORE</span><h3>Browse places</h3><p class="muted">Open reusable place records.</p></button>
      <button class="card card-button" data-view="transit"><span class="kicker">MOVE</span><h3>Transit</h3><p class="muted">Review the current route reference.</p></button>
      <button class="card card-button" data-view="food"><span class="kicker">EAT</span><h3>Food</h3><p class="muted">Browse dining stops and food references.</p></button>
      <button class="card card-button" data-view="tools"><span class="kicker">PREPARE</span><h3>Trip Tools</h3><p class="muted">Packing, reservations, flights, and trip facts.</p></button>
    </div>

    <section class="card data-status-card">
      <div class="section-head"><div><div class="kicker">ITINERARY DATA</div><h2>Update-ready</h2></div><span class="tag">${tripMeta.appDataVersion.toUpperCase()}</span></div>
      <p class="muted">Last normalized update: ${tripMeta.lastUpdated}. Source: ${tripMeta.sources[0].label}.</p>
      <p class="muted">Open dates remain open unless you provide new plans explicitly.</p>
    </section>

    <div class="section-head"><div><div class="kicker">TRIP PARTS</div><h2>Your journey</h2></div></div>
    <div class="grid grid-2">
      ${tripData.parts.map(part => `
        <button class="card card-button" data-part="${part.id}">
          <div class="kicker">${part.shortTitle.toUpperCase()}</div>
          <h3>${part.title}</h3>
          <p class="muted">${part.description}</p>
          <span class="tag">${part.days.length} itinerary days</span>
        </button>`).join("")}
    </div>`;
}
function renderItinerary() {
  const days = allDays();
  const selected = dayByDate(state.selectedDate || days[0].date) || days[0];
  const relevantStops = (selected.stops || []).filter(stop => stopMatchesTraveler(stop, selected));
  const planned = days.filter(d => d.status !== "open" && travelerMatchesFilter(d)).length;
  const visibleDays = days.filter(d => travelerMatchesFilter(d));
  const navisNotice = selected.date >= "2026-12-12" && state.travelerFilter === "navis"
    ? `<div class="notice">The Navis have returned to Manila. This view shows only any explicitly assigned The Navis travel events.</div>` : "";
  const remainingNotice = selected.date >= "2026-12-12" && state.travelerFilter === "remaining"
    ? `<div class="notice">Georgia, Raph, and Arth continue the Japan itinerary from Dec 12 onward.</div>` : "";
  return `<div class="tools-view">
    <section class="hero">
      <div class="kicker">MASTER ITINERARY</div>
      <div class="hero-title-row"><div><h1>Kyoto × Osaka</h1></div><div class="hero-emblem" aria-hidden="true">⛩️</div></div><div class="pixel-divider"></div>
      <p class="muted">November 30 → December 19, 2026</p>
    </section>
    <section class="card traveler-lens-card">
      <div class="section-head"><div><div class="kicker">TRAVELER LENS</div><h2>Whose itinerary?</h2><p class="muted">This is a viewing filter, not a separate group mode. Shared plans remain shared.</p></div><span class="tag">${travelerLabel()}</span></div>
      <div class="traveler-filter" role="group" aria-label="Filter itinerary by traveler">
        ${[["all","Everyone"],["navis","The Navis"],["remaining","Remaining group"]].map(([key,label])=>`<button class="traveler-filter-btn ${state.travelerFilter===key?'selected':''}" data-traveler-filter="${key}">${label}</button>`).join("")}
      </div>
    </section>
    <div class="stats">
      <div class="stat"><strong>${visibleDays.length}</strong><span>RELEVANT DAYS</span></div>
      <div class="stat"><strong>${planned}</strong><span>PLANNED DAYS</span></div>
      <div class="stat"><strong>${visibleDays.filter(d => d.status === "open").length}</strong><span>OPEN DAYS</span></div>
    </div>

    ${navisNotice}${remainingNotice}
    <section class="itinerary-detail card">
      <div class="section-head">
        <div><div class="kicker">SELECTED DAY</div><h2>${selected.title}</h2><p class="muted">${formatDate(selected.date)} · ${selected.city}</p></div>
        <span class="tag">${selected.status === "open" ? "OPEN / UNPLANNED" : `${relevantStops.length} RELEVANT STOPS`}</span>
      </div>
      <p class="muted">${selected.subtitle}</p>
      ${selected.status === "open" ? `<div class="notice">This date is intentionally open because the supplied itinerary contains no planned stops for this day.</div>` : relevantStops.length ? `<div class="stop-list">${relevantStops.map(stopMarkup).join("")}</div>` : `<div class="notice">No stops are assigned to ${escapeHtml(travelerLabel())} on this date.</div>`}
    </section>

    ${tripData.parts.map(part => {
      const partDays = part.days.filter(day => travelerMatchesFilter(day));
      return `<section>
        <div class="section-head">
          <div><div class="kicker">${part.shortTitle.toUpperCase()}</div><h2>${part.title}</h2></div>
          <span class="tag">${part.startDate} → ${part.endDate}</span>
        </div>
        <div class="day-picker-grid">
          ${partDays.map(day => `
            <button class="day-picker ${day.date === selected.date ? "selected" : ""} ${day.status === "open" ? "open" : ""}" data-date="${day.date}">
              <span class="day-picker-date">${formatDate(day.date).split(",")[0]}</span>
              <strong>${formatDate(day.date).split(",")[1].trim()}</strong>
              <span>${day.city}</span>
              <small>${day.status === "open" ? "OPEN" : `${(day.stops || []).filter(stop => stopMatchesTraveler(stop, day)).length} relevant stops`}</small>
            </button>`).join("")}
        </div>
      </section>`;
    }).join("")}`;
}

function googleDirectionsUrl(origin, destination, mode="transit") {
  const q = (v) => encodeURIComponent(v || "");
  return `https://www.google.com/maps/dir/?api=1&origin=${q(origin)}&destination=${q(destination)}&travelmode=${mode}`;
}

function routeEndpoint(stop) {
  const place = stop.placeId ? placeById(stop.placeId) : null;
  if (place?.location?.address) return place.location.address;
  return `${stop.title}, Japan`;
}

function renderDayRoute() {
  const days = allDays();
  const selected = dayByDate(state.selectedDate || days[0].date) || days[0];
  const stops = selected.stops || [];
  const pairs = stops.slice(0, -1).map((stop, i) => ({
    from: stop,
    to: stops[i + 1]
  }));
  return `<div class="dayroute-view">
    <section class="hero">
      <div class="kicker">DAY ROUTE PLANNER</div>
      <div class="hero-title-row"><div><h1>${escapeHtml(selected.title)}</h1></div><div class="hero-emblem" aria-hidden="true">🧭</div></div>
      <div class="pixel-divider"></div>
      <p class="muted">${formatDate(selected.date)} · ${escapeHtml(selected.city)} · ${stops.length} stops</p>
    </section>
    <section class="card route-day-selector">
      <div class="section-head"><div><div class="kicker">SELECT A DAY</div><h2>Build the day's route</h2></div><span class="tag">${selected.status === "open" ? "OPEN" : "IN ORDER"}</span></div>
      <div class="day-route-picker">${days.map(d => `<button class="day-route-chip ${d.date===selected.date?'selected':''} ${d.status==='open'?'open':''}" data-view="dayroute" data-date="${d.date}"><strong>${formatDate(d.date).split(',')[0]}</strong><span>${formatDate(d.date).split(',')[1].trim()}</span><small>${d.status==='open'?'OPEN':`${(d.stops||[]).length} stops`}</small></button>`).join('')}</div>
    </section>
    ${selected.status === 'open' ? `<div class="notice">This date is intentionally open in the supplied itinerary, so there is no route to construct yet.</div>` : `
    <section class="card">
      <div class="section-head"><div><div class="kicker">STOP SEQUENCE</div><h2>${stops.length} stops in itinerary order</h2></div><a class="btn secondary" target="_blank" rel="noopener" href="${stops.length>1 ? googleDirectionsUrl(routeEndpoint(stops[0]), routeEndpoint(stops[stops.length-1]), 'transit') : googleDirectionsUrl(routeEndpoint(stops[0]||{title:selected.city}), routeEndpoint(stops[0]||{title:selected.city}), 'transit')}">OPEN DAY IN MAPS ↗</a></div>
      <div class="day-route-sequence">
        ${stops.map((stop,i)=>`<div class="day-route-stop"><span class="day-route-number">${i+1}</span><div><strong>${escapeHtml(stop.title)}</strong><small>${escapeHtml(stop.note || stop.type || '')}</small>${stop.placeId && placeById(stop.placeId)?.location ? `<span class="verified-chip">✓ location verified</span>` : `<span class="muted">location reference pending</span>`}</div></div>${i<stops.length-1 ? `<div class="day-route-connector"><span></span></div>`:''}`).join('')}
      </div>
    </section>
    <section>
      <div class="section-head"><div><div class="kicker">BETWEEN STOPS</div><h2>Navigation links</h2></div><span class="tag">EXTERNAL MAPS</span></div>
      <div class="grid grid-2">
        ${pairs.length ? pairs.map((pair,i)=>`<article class="card route-leg-card"><div class="route-leg-head"><span class="tag">LEG ${i+1}</span><span class="muted">${i+1} → ${i+2}</span></div><h3>${escapeHtml(pair.from.title)} → ${escapeHtml(pair.to.title)}</h3><p class="muted">The app preserves the itinerary order. Use the external map link for current walking/transit directions.</p><div class="route-leg-actions"><a class="btn secondary" target="_blank" rel="noopener" href="${googleDirectionsUrl(routeEndpoint(pair.from), routeEndpoint(pair.to), 'transit')}">TRANSIT ↗</a><a class="btn secondary" target="_blank" rel="noopener" href="${googleDirectionsUrl(routeEndpoint(pair.from), routeEndpoint(pair.to), 'walking')}">WALK ↗</a></div></article>`).join('') : `<div class="notice">There is only one stop on this day, so no between-stop legs are needed.</div>`}
      </div>
    </section>
    <div class="notice">Route order comes from your itinerary. Exact departure times, platforms, service status and disruptions are intentionally left to live navigation and operator information.</div>`}`;
}

function placeById(id) {
  return tripData.places.find(p => p.id === id);
}

function placeOccurrences(id) {
  return placeIndex[id] || [];
}

function renderPlaces() {
  const categories = [...new Set(tripData.places.map(p => p.category))].sort();
  const selected = new URLSearchParams(location.search).get("place");
  if (selected && placeById(selected)) return renderPlaceDetail(selected);
  return `
    <section class="hero">
      <div class="kicker">PLACE INDEX</div>
      <div class="hero-title-row"><div><h1>Places</h1></div><div class="hero-emblem" aria-hidden="true">🏯</div></div><div class="pixel-divider"></div>
      <p class="muted">Every itinerary stop is now a reusable place record. Open a place to see where it appears in the trip.</p>
      <div class="place-controls"><input class="search-box" id="placeSearch" placeholder="Search places, restaurants, shopping..." aria-label="Search places"><select id="placeCategory" aria-label="Filter by category"><option value="">All categories</option>${categories.map(c=>`<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join("")}</select></div>
    </section>
    <div class="place-count" id="placeCount">${tripData.places.length} places</div>
    <div id="placeResults" class="grid grid-3">
      ${tripData.places.map(p => `
        <button class="card place-card place-card-button" data-place="${p.id}" data-search="${p.name.toLowerCase()} ${p.city.toLowerCase()} ${p.category}">
          <span class="tag">${p.category.toUpperCase()}</span>
          <h3>${p.name}</h3>
          <p class="muted">${p.city} · ${p.usageCount || 0} itinerary appearance${p.usageCount === 1 ? "" : "s"}</p>
          ${p.priceJPY ? `<span class="tag">¥${p.priceJPY.toLocaleString()}</span>` : ""}
        </button>`).join("")}
    </div>`;
}

function renderPlaceDetail(id) {
  const p = placeById(id);
  const e = encyclopediaIndex[id] || {};
  const occurrences = e.occurrences || placeOccurrences(id);
  const partLabel = p.part === "part1" ? "The Navis" : p.part === "part2" ? "Group" : "Shared";
  const practical = e.practical || {};
  const resources = e.resources || {};
  const location = e.location || {};
  const resourceButton = (label, href, disabled=false) => disabled || !href
    ? `<span class="btn secondary disabled-link" aria-disabled="true">${label}<small>Not identified</small></span>`
    : `<a class="btn secondary" href="${href}" target="_blank" rel="noopener">${label} ↗</a>`;
  const contextPlace = (kind, item) => item?.placeId
    ? `<div class="context-link"><span class="context-label">${kind}</span><button class="text-link" data-place="${item.placeId}">${escapeHtml(item.title)}</button></div>`
    : `<div class="context-link"><span class="context-label">${kind}</span><span class="muted">${item?.title ? escapeHtml(item.title) : 'None — this is the first/last stop in this itinerary segment.'}</span></div>`;

  return `
    <div class="place-encyclopedia">
      <section class="hero">
        <button class="btn secondary" data-view="places">← ALL PLACES</button>
        <div class="place-detail-head">
          <div><div class="kicker">ATTRACTION ENCYCLOPEDIA · ${p.category.toUpperCase()} · ${p.city.toUpperCase()}</div><h1>${escapeHtml(p.name)}</h1><div class="pixel-divider"></div></div>
          <div class="hero-emblem" aria-hidden="true">${icons[p.category] || "📍"}</div>
        </div>
        <div class="tag-row"><span class="tag">${partLabel}</span>${p.priceJPY ? `<span class="tag">¥${p.priceJPY.toLocaleString()}</span>` : ""}<span class="tag">${occurrences.length} itinerary appearance${occurrences.length===1?"":"s"}</span></div>
      </section>

      <section class="card encyclopedia-section">
        <div class="section-head"><div><div class="kicker">OVERVIEW</div><h2>Why it's on your itinerary</h2></div></div>
        <p>${escapeHtml(e.overview || `A ${p.category} stop in ${p.city} included in your Kansai itinerary.`)}</p>
        <div class="encyclopedia-mini-grid">
          <div class="encyclopedia-mini"><span>TRIP ROLE</span><strong>${escapeHtml(p.category === 'hotel' ? 'Accommodation / base' : p.category === 'food' ? 'Food stop' : p.category === 'shopping' ? 'Shopping stop' : p.category === 'transport' || p.category === 'airport' || p.category === 'station' ? 'Travel connection' : 'Sightseeing / activity')}</strong></div>
          <div class="encyclopedia-mini"><span>ITINERARY APPEARANCES</span><strong>${occurrences.length}</strong></div>
          <div class="encyclopedia-mini"><span>CITY</span><strong>${escapeHtml(p.city)}</strong></div>
        </div>
      </section>

      <section class="card encyclopedia-section">
        <div class="section-head"><div><div class="kicker">PRACTICAL INFORMATION</div><h2>Before you go</h2></div></div>
        <div class="encyclopedia-facts">
          <div class="encyclopedia-fact"><span>Opening hours</span><strong>${escapeHtml(practical.hours || 'Verify before visit')}</strong></div>
          <div class="encyclopedia-fact"><span>Admission</span><strong>${escapeHtml(practical.admission || 'Verify before visit')}</strong></div>
          <div class="encyclopedia-fact"><span>Recommended visit</span><strong>${escapeHtml(practical.duration || 'About 1–2 hours')}</strong></div>
          <div class="encyclopedia-fact"><span>Location</span><strong>${escapeHtml(location.label || `${p.city}, Japan`)}</strong>${location.verified ? '<small class="verified-chip">✓ location verified</small>' : '<small class="muted">Exact location not yet verified</small>'}</div>
          <div class="encyclopedia-fact"><span>Best time to visit</span><strong>${escapeHtml(practical.best || 'Follow the itinerary timing')}</strong></div>
          <div class="encyclopedia-source-status"><span class="${e.verification?.status === 'source-backed' ? 'verified-chip' : 'muted'}">${e.verification?.status === 'source-backed' ? '✓ SOURCE-BACKED' : 'VERIFY BEFORE VISIT'}</span>${e.verification?.verifiedDate ? `<small>Verified ${escapeHtml(e.verification.verifiedDate)}</small>` : '<small>Practical details not yet deeply verified in this pass.</small>'}</div>
        </div>
        <div class="notice">${escapeHtml(e.sourceNote || 'Verify hours, admission and conditions before travel. The app does not invent missing facts.')}</div>
      </section>

      <section class="card encyclopedia-section">
        <div class="section-head"><div><div class="kicker">WEB RESOURCES</div><h2>Useful links</h2></div></div>
        <div class="resource-grid">
          ${resourceButton('WIKIPEDIA', resources.wikipedia)}
          ${resourceButton('OFFICIAL WEBSITE', resources.official, !resources.official)}
          ${resourceButton('GOOGLE MAPS', resources.maps)}
        </div>
      </section>

      <section class="card encyclopedia-section">
        <div class="section-head"><div><div class="kicker">TRIP CONTEXT</div><h2>Where this fits</h2></div></div>
        <p class="muted">The place is linked directly to the canonical itinerary. Use the surrounding-stop links to move through the day without returning to the main itinerary.</p>
        <div class="place-context-list">
          ${occurrences.length ? occurrences.map((o,i)=>`
            <article class="context-occurrence">
              <div class="context-occurrence-head">
                <div><span class="kicker">VISIT ${i+1}</span><h3>You're visiting here on ${formatDate(o.date)}.</h3></div>
                <span class="tag">STOP ${o.order}</span>
              </div>
              <p class="muted">${escapeHtml(o.dayTitle)}${o.note ? ` · ${escapeHtml(o.note)}` : ''}</p>
              <div class="context-neighbors">
                ${contextPlace('Previous stop', o.previous)}
                ${contextPlace('Next stop', o.next)}
              </div>
              <div class="encyclopedia-context-actions">
                <button class="btn secondary" data-date="${o.date}" data-view="itinerary">OPEN THIS DAY ↗</button>
                <button class="btn secondary" data-date="${o.date}" data-view="dayroute">OPEN DAY ROUTE ↗</button>
              </div>
            </article>`).join('') : `<div class="notice">This place exists in the place database but is not currently linked to a dated itinerary stop.</div>`}
        </div>
      </section>

      <section class="card encyclopedia-section">
        <div class="section-head"><div><div class="kicker">LOCATION</div><h2>Get there</h2></div></div>
        ${location.verified && location.coordinates ? `<div class="verified-location"><strong>${escapeHtml(location.label)}</strong><small>Coordinates: ${location.coordinates.lat.toFixed(5)}, ${location.coordinates.lng.toFixed(5)}</small><a class="btn secondary" href="${resources.maps}" target="_blank" rel="noopener">OPEN IN GOOGLE MAPS ↗</a></div>` : `<div class="notice">Exact coordinates are not yet verified for this place. Google Maps search is provided without pretending that the app has a precise verified pin.</div>`}
      </section>
    </div>`;
}

function renderMap() {
  const cities = [
    {name:"Kyoto", id:"kyoto", note:"Kyoto base + eastern/southern Kyoto days", color:"#6f5b75"},
    {name:"Osaka", id:"osaka", note:"Osaka bases + central Osaka days", color:"#c65b3f"},
    {name:"Osaka Bay", id:"bay", note:"USJ / airport-facing side of Kansai", color:"#66784b"}
  ];
  const cityPlaces = city => tripData.places.filter(p => p.city.toLowerCase().includes(city.toLowerCase()));
  const markers = [
    {city:"Kyoto", x:29, y:35, label:"Kyoto", cls:"kyoto"},
    {city:"Osaka", x:67, y:56, label:"Osaka", cls:"osaka"},
    {city:"Osaka Bay", x:78, y:72, label:"Osaka Bay", cls:"bay"}
  ];
  return `
    <section class="hero">
      <div class="kicker">TRIP LOCATION CONTEXT</div>
      <div class="hero-title-row"><div><h1>Kyoto × Osaka map</h1></div><div class="hero-emblem" aria-hidden="true">🗺</div></div>
      <div class="pixel-divider"></div>
      <p class="muted">A trip-oriented map view tied to the same place records used by the itinerary. This first map pass uses city-level context rather than inventing exact coordinates.</p>
    </section>
    <section class="map-layout">
      <div class="card trip-map" aria-label="Schematic Kansai trip map">
        <div class="map-grid"></div>
        <div class="map-route route-1"></div><div class="map-route route-2"></div>
        ${markers.map(m=>`<button class="map-marker ${m.cls}" data-map-city="${m.city}" style="left:${m.x}%;top:${m.y}%"><span class="marker-dot"></span><strong>${m.label}</strong></button>`).join("")}
        <div class="map-compass">N<br>↑</div>
        <div class="map-label">SCHEMATIC KANSAI</div>
        <div class="map-attribution">Map context only · OpenStreetMap not embedded in this pass</div>
      </div>
      <aside class="map-side">
        <div class="section-head"><div><div class="kicker">TRIP ZONES</div><h2>Where you'll be</h2></div></div>
        ${cities.map(c=>`<button class="card map-zone" data-map-city="${c.name}"><span class="zone-dot ${c.id}"></span><span><strong>${c.name}</strong><small>${c.note}</small><em>${cityPlaces(c.name === "Osaka Bay" ? "Osaka" : c.name).length} place records</em></span>→</button>`).join("")}
      </aside>
    </section>
    <section class="section-head"><div><div class="kicker">PLACES ON THE MAP</div><h2>Trip place index</h2></div><span class="tag">${tripData.places.length} RECORDS</span></section>
    <div class="grid grid-3">
      ${tripData.places.slice(0,24).map(p=>`<button class="card card-button map-place" data-view="places" data-place="${p.id}"><span class="tag">${escapeHtml(p.city)}</span><h3>${escapeHtml(p.name)}</h3><p class="muted">${escapeHtml(p.category)}</p>${p.location ? `<small class="verified-chip">✓ coordinates verified</small>` : `<small class="muted">coordinates pending</small>`}</button>`).join("")}
    </div>
    <section class="card verified-location-index">
      <div class="section-head"><div><div class="kicker">VERIFIED LOCATIONS</div><h2>Open exact map positions</h2></div><span class="tag">${Object.keys(locationIndex).length} VERIFIED</span></div>
      <div class="verified-location-list">${Object.entries(locationIndex).map(([id,l])=>{ const p=placeById(id); return `<div class="verified-location-row"><div><strong>${escapeHtml(p?.name || id)}</strong><small>${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}</small></div><a class="btn secondary" href="${l.mapsQuery}" target="_blank" rel="noopener">MAP ↗</a></div>`; }).join("")}</div>
      <div class="notice">Only locations with a verified coordinate record are shown here. Other places remain searchable, but the app will not invent a precise pin.</div>
    </section>`;
}


function renderFood() {
  const cities = [...new Set(foodIndex.entries.map(f => f.city))].sort();
  const meals = [...new Set(foodIndex.entries.flatMap(f => f.occurrences.map(o => {
    const t = `${o.stopTitle} ${o.note}`.toLowerCase();
    if (t.includes("breakfast")) return "breakfast";
    if (t.includes("lunch")) return "lunch";
    if (t.includes("dinner")) return "dinner";
    if (t.includes("cafe") || t.includes("coffee") || t.includes("bakery")) return "cafe / snack";
    return "meal / food stop";
  })))].sort();
  return `
    <section class="hero">
      <div class="kicker">FOOD & DINING</div>
      <div class="hero-title-row"><div><h1>Eat your way through Kansai</h1></div><div class="hero-emblem" aria-hidden="true">🍜</div></div>
      <div class="pixel-divider"></div>
      <p class="muted">Your food guide is derived directly from the itinerary. Kyoto's official travel guide describes a broad food culture spanning kaiseki, shojin-ryori, obanzai, sushi, tempura, soba, ramen, sweets, tea, coffee and bakeries.</p>
      <div class="hero-actions"><a class="btn secondary" href="https://kyoto.travel/en/food-and-drink" target="_blank" rel="noopener">KYOTO FOOD GUIDE ↗</a></div>
    </section>
    <section class="grid grid-3 food-stats">
      <div class="card"><div class="kicker">ON YOUR ITINERARY</div><strong class="big-number">${foodIndex.foodCount}</strong><p class="muted">food & dining records</p></div>
      <div class="card"><div class="kicker">KYOTO</div><strong class="big-number">${foodIndex.entries.filter(f=>f.city==='Kyoto').length}</strong><p class="muted">food stops</p></div>
      <div class="card"><div class="kicker">OSAKA</div><strong class="big-number">${foodIndex.entries.filter(f=>f.city==='Osaka').length}</strong><p class="muted">food stops</p></div>
    </section>
    <section class="card">
      <div class="section-head"><div><div class="kicker">FOOD INDEX</div><h2>Restaurants, cafés & food stops</h2></div><span class="tag">${foodIndex.foodCount} RECORDS</span></div>
      <div class="food-filters"><select id="foodCity"><option value="">All cities</option>${cities.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select><select id="foodMeal"><option value="">All meal contexts</option>${meals.map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}</select></div>
      <div id="foodGrid" class="grid grid-2">${foodCards(foodIndex.entries)}</div>
    </section>
    <section class="card"><div class="section-head"><div><div class="kicker">PRACTICAL NOTE</div><h2>Use the itinerary as the source of truth</h2></div></div><p class="muted">Restaurant hours, queues, menus and reservations can change. The app stores the trip's planned food stops, while current operating information should be checked close to the visit. Reservation notes already present in the itinerary are surfaced on the relevant card.</p></section></div>`;
}

function foodMealContext(entry) {
  const text = entry.occurrences.map(o=>`${o.stopTitle} ${o.note}`).join(' ').toLowerCase();
  if(text.includes('breakfast')) return 'breakfast';
  if(text.includes('lunch')) return 'lunch';
  if(text.includes('dinner')) return 'dinner';
  if(text.includes('cafe') || text.includes('coffee') || text.includes('bakery')) return 'cafe / snack';
  return 'meal / food stop';
}
function foodCards(entries) {
  return entries.map(f=>`<button class="card card-button food-card" data-view="places" data-place="${f.id}"><div class="food-card-top"><span class="tag">${escapeHtml(f.city)}</span><span class="tag">${escapeHtml(foodMealContext(f))}</span></div><h3>${escapeHtml(f.name)}</h3><p class="muted">${f.occurrences.map(o=>`${formatDate(o.date)}${o.status?` · ${escapeHtml(o.status)}`:''}`).join('<br>')}</p>${f.occurrences.some(o=>/book|reservation/i.test(`${o.note} ${o.status}`)) ? `<small class="verified-chip">Reservation / booking note in itinerary</small>`:''}<span class="food-arrow">VIEW PLACE →</span></button>`).join('');
}


function yen(v){return `¥${Number(v).toLocaleString('en-US')}`}
function php(v){return `₱${Math.round(Number(v)*budgetIndex.fx.jpyToPhp).toLocaleString('en-US')}`}
function renderBudget(){
  const entries=budgetIndex.entries;
  const total=entries.reduce((s,e)=>s+e.amountJPY,0), food=entries.filter(e=>e.category==='food').reduce((s,e)=>s+e.amountJPY,0), attractions=entries.filter(e=>e.category==='attraction').reduce((s,e)=>s+e.amountJPY,0), transit=entries.filter(e=>e.category==='transit').reduce((s,e)=>s+e.amountJPY,0);
  const days=[...new Set(entries.map(e=>e.date))].sort();
  return `<div class="budget-view"><section class="hero"><div class="kicker">TRIP BUDGET & MONEY</div><div class="hero-title-row"><div><h1>Know your yen</h1></div><div class="hero-emblem" aria-hidden="true">¥</div></div><div class="pixel-divider"></div><p class="muted">Known price references from the itinerary, separated from estimates and live navigation costs.</p></section>
  <section class="grid grid-4 budget-stats"><div class="card"><div class="kicker">KNOWN REFERENCES</div><strong class="big-number">${yen(total)}</strong><p class="muted">${php(total)} at the stored FX reference</p></div><div class="card"><div class="kicker">FOOD</div><strong class="big-number">${yen(food)}</strong><p class="muted">${php(food)}</p></div><div class="card"><div class="kicker">ATTRACTIONS</div><strong class="big-number">${yen(attractions)}</strong><p class="muted">${php(attractions)}</p></div><div class="card"><div class="kicker">TRANSIT</div><strong class="big-number">${yen(transit)}</strong><p class="muted">${php(transit)}</p></div></section>
  <section class="card"><div class="section-head"><div><div class="kicker">CURRENCY</div><h2>JPY → PHP</h2></div><span class="tag">1 JPY = ₱${budgetIndex.fx.jpyToPhp.toFixed(4)}</span></div><p class="muted">${budgetIndex.fx.label}. This is a conversion reference, not a guaranteed card/bank settlement rate.</p><div class="budget-converter"><label>Amount in yen<input id="budgetAmount" type="number" min="0" step="100" value="1000"></label><div class="budget-convert-output"><span>PHP reference</span><strong id="budgetPhp">${php(1000)}</strong></div></div></section>
  <section class="card"><div class="section-head"><div><div class="kicker">KNOWN COSTS</div><h2>Trip price references</h2></div><span class="tag">${entries.length} ITEMS</span></div><div class="budget-table">${entries.map(e=>`<div class="budget-row"><div><strong>${escapeHtml(e.name)}</strong><small>${formatDate(e.date)} · ${escapeHtml(e.category)}${e.note?` · ${escapeHtml(e.note)}`:''}</small></div><div class="budget-price"><strong>${yen(e.amountJPY)}</strong><span>${php(e.amountJPY)}</span><em>${escapeHtml(e.status)}</em></div></div>`).join('')}</div></section>
  <section class="card"><div class="section-head"><div><div class="kicker">IMPORTANT</div><h2>What this total means</h2></div></div><p class="muted">The total is only the sum of prices currently stored in the app. It is not your full trip budget: hotels, many meals, shopping, local transit and date-dependent tickets may not have a confirmed price yet. Unknown costs are intentionally excluded rather than guessed.</p></section></div>`;
}

function renderTools(){
  const packingKey = "kansai-tools-packing-v1";
  const prepKey = "kansai-tools-prep-v1";
  const packing = [
    ["Travel documents","Passport, flight details, accommodation details"],
    ["Money","JPY cash/card setup and a small backup payment method"],
    ["Phone","Japan-capable data/eSIM plan, charger and power bank"],
    ["Transit","Suica/IC setup or other planned payment method"],
    ["Clothing","Late-autumn layers, comfortable walking shoes, rain layer"],
    ["Daily carry","Small bag, water, tissues, hand towel"],
    ["Health","Regular medications and a compact personal first-aid kit"],
    ["Trip essentials","Reservations, tickets, maps and key confirmations saved offline"]
  ];
  const prep = [
    ["Review flights","Confirm arrival/departure times and airport details"],
    ["Review lodging","Confirm the three lodging stages and check-in/check-out details"],
    ["Check timed tickets","Especially Universal Studios Japan, Nintendo Museum and other date-dependent admissions"],
    ["Check reservations","Review restaurant booking notes already present in the itinerary"],
    ["Download essentials","Keep itinerary, accommodation details and important confirmations available offline"],
    ["Check weather","Recheck Kyoto/Osaka weather shortly before each travel day"],
    ["Review open days","Dec 15–19 are intentionally unplanned in the supplied itinerary"],
    ["Final money check","Carry enough JPY/payment access for meals, transit and shopping"]
  ];
  const checked = key => { try { return JSON.parse(localStorage.getItem(key)||"[]"); } catch { return []; } };
  const packingChecked=checked(packingKey), prepChecked=checked(prepKey);
  const checkList=(items,key,selected)=>items.map((x,i)=>`<label class="tool-check"><input type="checkbox" data-check-key="${key}" data-check-index="${i}" ${selected.includes(i)?"checked":""}><span><strong>${escapeHtml(x[0])}</strong><small>${escapeHtml(x[1])}</small></span></label>`).join('');
  const lodging = [
    ["Nov 30–Dec 5","KOKO HOTEL Osaka Shinsekai","Osaka","Check-in Nov 30"],
    ["Dec 5–Dec 8","55 Yumiyachō","Kyoto","Check-in listed at 3:00 PM"],
    ["Dec 8–Dec 13","MACHIYA HOTEL","Osaka","Check-in Dec 8 · check-out Dec 13"]
  ];
  return `
    <section class="hero">
      <div class="kicker">TRIP TOOLS & PREPARATION</div>
      <div class="hero-title-row"><div><h1>Get Kansai-ready</h1></div><div class="hero-emblem" aria-hidden="true">🎒</div></div>
      <div class="pixel-divider"></div>
      <p class="muted">Practical checklists built from your supplied itinerary. Checklist progress is saved locally in this browser and does not change the canonical trip plan.</p>
    </section>
    <section class="grid grid-2">
      <div class="card tool-panel"><div class="section-head"><div><div class="kicker">PACKING</div><h2>Pack once, travel lighter</h2></div><span class="tag" id="packingProgress">${packingChecked.length}/${packing.length}</span></div><div class="tool-check-list">${checkList(packing,packingKey,packingChecked)}</div><button class="btn secondary tool-reset" data-reset-key="${packingKey}">RESET LIST</button></div>
      <div class="card tool-panel"><div class="section-head"><div><div class="kicker">PRE-TRIP</div><h2>Before departure</h2></div><span class="tag" id="prepProgress">${prepChecked.length}/${prep.length}</span></div><div class="tool-check-list">${checkList(prep,prepKey,prepChecked)}</div><button class="btn secondary tool-reset" data-reset-key="${prepKey}">RESET LIST</button></div>
    </section>
    <section class="section-head"><div><div class="kicker">LODGING</div><h2>Your accommodation stages</h2></div><span class="tag">3 BASES</span></div>
    <div class="grid grid-3">${lodging.map(x=>`<article class="card tool-lodging"><span class="tag">${x[0]}</span><h3>${escapeHtml(x[1])}</h3><p class="muted">${escapeHtml(x[2])}</p><small>${escapeHtml(x[3])}</small></article>`).join('')}</div>
    <section class="card"><div class="section-head"><div><div class="kicker">THE NAVIS FLIGHTS</div><h2>Confirmed flights</h2></div><span class="tag">2 FLIGHTS</span></div>
      <div class="flight-tools-grid">
        <div class="flight-tool-card"><span class="tag">ARRIVAL · NOV 30</span><h3>Manila → Osaka</h3><p><strong>PR 412</strong> · Philippine Airlines</p><p class="muted">09:10 MNL → 13:45 KIX · nonstop · 3h 35min</p></div>
        <div class="flight-tool-card"><span class="tag">DEPARTURE · DEC 12</span><h3>Osaka → Manila</h3><p><strong>PR 407</strong> · Philippine Airlines</p><p class="muted">10:05 KIX → 13:35 MNL · nonstop · 4h 30min</p></div>
      </div>
      <div class="notice">These flight details are confirmed from the supplied booking image. On Dec 12, PR 407 returns Carlos and Isay (The Navis) to Manila; Georgia, Raph, and Arth remain in Osaka and continue the itinerary.</div>
    </section>
    <section class="card"><div class="section-head"><div><div class="kicker">RESERVATIONS & TICKETS</div><h2>Things worth confirming</h2></div></div>
      <div class="tool-callouts">
        <div class="notice"><strong>Booked in the itinerary:</strong> andot Kyoto kimono rental — Dec 7, 10:00 AM–4:30 PM.</div>
        <div class="notice"><strong>Reservation note:</strong> Japanese Buffet Dining Shinsaibashi Maruhana — Dec 14 lunch; the itinerary says to consider booking ahead.</div>
        <div class="notice"><strong>Date-dependent:</strong> Universal Studios Japan and Nintendo Museum pricing/admission should be checked against the current ticket/booking information before travel.</div>
      </div>
    </section>
    <section class="card"><div class="section-head"><div><div class="kicker">TRIP FACTS</div><h2>Quick reference</h2></div></div><div class="stats tool-facts"><div class="stat"><strong>Nov 30</strong><span>PART 1 START</span></div><div class="stat"><strong>Dec 5</strong><span>KYOTO BASE TRANSITION</span></div><div class="stat"><strong>Dec 8</strong><span>OSAKA BASE TRANSITION</span></div><div class="stat"><strong>Dec 15–19</strong><span>OPEN / UNPLANNED</span></div></div><p class="muted">The app deliberately does not create plans for Dec 15–19. Add them through the itinerary update workflow when you have confirmed plans.</p></section>
  </div>`;
}

function renderSimple(view) {
  const labels = {
    food:["🍜","Food","Food guide and dining records are available."],
    budget:["¥","Trip Budget","Known itinerary price references and JPY/PHP conversion."] ,
    tools:["🎒","Trip Tools","Packing, preparation tools and practical trip utilities."]
  };
  const [icon,title,text] = labels[view] || ["📍","Section","More trip tools are coming later."];
  return `<section class="hero"><div class="kicker">${icon} COMING LATER</div><h1>${title}</h1><p class="muted">${text}</p></section>
    <div class="card"><h3>Data foundation ready</h3><p>The reusable itinerary and place records are already available for this module without restructuring the trip database.</p></div>`;
}

function render() {
  const canGoBack = state.history.length > 0;
  backButton.classList.toggle("visible", canGoBack);
  backButton.setAttribute("aria-hidden", String(!canGoBack));
  document.querySelectorAll(".sidebar .nav-item, .mobile-nav [data-view]").forEach(el => el.classList.toggle("active", el.dataset.view === state.view));
  main.innerHTML =
    state.view === "today" ? renderToday() :
    state.view === "itinerary" ? renderItinerary() :
    state.view === "dayroute" ? renderDayRoute() :
    state.view === "places" ? renderPlaces() :
    state.view === "transit" ? renderTransit() :
    state.view === "map" ? renderMap() :
    state.view === "food" ? renderFood() :
    state.view === "budget" ? renderBudget() :
    state.view === "tools" ? renderTools() :
    state.view === "search" ? renderSearch(new URLSearchParams(location.search).get("q") || "") :
    renderSimple(state.view);

  // Main-area navigation is handled once by the delegated listener below.
  main.querySelectorAll("[data-part]").forEach(btn => btn.addEventListener("click", () => setView("itinerary")));
  main.querySelectorAll("[data-traveler-filter]").forEach(btn => btn.addEventListener("click", () => { state.travelerFilter = btn.dataset.travelerFilter; localStorage.setItem("kansai-traveler-filter", state.travelerFilter); render(); }));
  if (state.view === "food") bindFoodFilters();
  if (state.view === "budget") {
    const amount = main.querySelector("#budgetAmount"), output = main.querySelector("#budgetPhp");
    const updateBudget = () => { const v = Math.max(0, Number(amount?.value || 0)); if (output) output.textContent = php(v); };
    amount?.addEventListener("input", updateBudget);
  }
  const transitFrom = main.querySelector("#transitFrom");
  const transitTo = main.querySelector("#transitTo");
  const updateTransit = () => {
    state.transitFrom = transitFrom?.value || ""; state.transitTo = transitTo?.value || "";
    state.transitFromName = placesForTransit().find(p => p.id === state.transitFrom)?.name || "";
    state.transitToName = placesForTransit().find(p => p.id === state.transitTo)?.name || "";
    render();
  };
  transitFrom?.addEventListener("change", updateTransit);
  transitTo?.addEventListener("change", updateTransit);
  main.querySelectorAll("[data-transit-from-name]").forEach(btn => btn.addEventListener("click", () => {
    const findPlace = name => placesForTransit().find(p => p.name === name);
    const a = findPlace(btn.dataset.transitFromName), b = findPlace(btn.dataset.transitToName);
    state.transitFrom = a?.id || ""; state.transitTo = b?.id || "";
    state.transitFromName = btn.dataset.transitFromName || "";
    state.transitToName = btn.dataset.transitToName || "";
    render();
  }));
  main.querySelectorAll("[data-place]").forEach(btn => {
    if (btn.dataset.view) return;
    const open = () => setView("places", {place: btn.dataset.place});
    btn.addEventListener("click", open);
    btn.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });

  const search = document.querySelector("#placeSearch");
  const category = document.querySelector("#placeCategory");
  const filterPlaces = () => {
    const q = (search?.value || "").toLowerCase().trim();
    const cat = category?.value || "";
    let visible = 0;
    document.querySelectorAll(".place-card").forEach(card => {
      const matches = (!q || card.dataset.search.includes(q)) && (!cat || card.dataset.search.includes(` ${cat}`));
      card.hidden = !matches; if (matches) visible++;
    });
    const count = document.querySelector("#placeCount");
    if (count) count.textContent = `${visible} place${visible === 1 ? "" : "s"}`;
  };
  search?.addEventListener("input", filterPlaces);
  category?.addEventListener("change", filterPlaces);
  const searchPage = document.querySelector("#searchPageInput");
  searchPage?.addEventListener("input", () => {
    const q = searchPage.value;
    const params = new URLSearchParams(location.search); params.set("view","search"); if (q) params.set("q",q); else params.delete("q");
    history.replaceState({view:"search", q}, "", `?${params.toString()}`);
    main.innerHTML = renderSearch(q);
    bindRenderedSearch();
  });
}

main.addEventListener("click", event => {
  const btn = event.target.closest?.("[data-view]");
  if (!btn) return;
  event.preventDefault();
  setView(btn.dataset.view, {date: btn.dataset.date || null, place: btn.dataset.place || null});
});

function bindRenderedSearch() {
  main.querySelectorAll("[data-map-city]").forEach(btn => btn.addEventListener("click", () => {
    const city = btn.dataset.mapCity;
    const matches = tripData.places.filter(p => p.city.toLowerCase().includes(city.toLowerCase() === "osaka bay" ? "osaka" : city.toLowerCase()));
    if (matches[0]) setView("places", {place: matches[0].id});
  }));

  const input = document.querySelector("#searchPageInput");
  if (input) { input.focus({preventScroll:true}); input.setSelectionRange(input.value.length,input.value.length); input.addEventListener("input", () => { const q=input.value; const params=new URLSearchParams(location.search); params.set("view","search"); if(q) params.set("q",q); else params.delete("q"); history.replaceState({view:"search",q},"",`?${params.toString()}`); main.innerHTML=renderSearch(q); bindRenderedSearch(); }); }
}

document.addEventListener("click", event => {
  const btn = event.target.closest?.("[data-view]");
  if (!btn || btn.closest("#main")) return;
  event.preventDefault();
  setView(btn.dataset.view, {date: btn.dataset.date || null, place: btn.dataset.place || null});
});
uiModeToggle?.addEventListener("click", () => {
  const next = document.documentElement.dataset.uiMode === "modern" ? "pixel" : "modern";
  document.documentElement.dataset.uiMode = next;
  localStorage.setItem("kansai-ui-mode", next);
  const modern = next === "modern";
  uiModeToggle.setAttribute("aria-label", modern ? "Switch to 16-bit mode" : "Switch to modern UI");
  uiModeToggle.setAttribute("title", modern ? "Switch to 16-bit mode" : "Switch to modern UI");
  uiModeToggle.textContent = modern ? "16" : "M";
  document.querySelector(".ui-mode-label")?.replaceChildren(document.createTextNode(modern ? "MODERN UI" : "16-BIT UI"));
});
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("kansai-theme", next);
});
menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
backButton.addEventListener("click", () => {
  if (state.history.length) {
    history.back();
  }
});
window.addEventListener("popstate", event => {
  const previous = state.history.pop();
  if (previous) {
    setView(previous.view, {push:false, date: previous.date, place: previous.place});
    return;
  }
  const params = new URLSearchParams(location.search);
  const view = params.get("view") || "today";
  setView(view, {push:false, date: params.get("date") || null, place: params.get("place") || null});
});



function bindFoodFilters() {
  const city = document.querySelector('#foodCity');
  const meal = document.querySelector('#foodMeal');
  const grid = document.querySelector('#foodGrid');
  if (!city || !meal || !grid) return;
  const update = () => {
    const c = city.value, m = meal.value;
    const filtered = foodIndex.entries.filter(f => (!c || f.city === c) && (!m || foodMealContext(f) === m));
    grid.innerHTML = filtered.length ? foodCards(filtered) : `<div class="notice">No food stops match these filters.</div>`;
    grid.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view, {place:btn.dataset.place})));
  };
  city.addEventListener('change', update); meal.addEventListener('change', update);
}

  if (state.view === "tools") {
    const bindChecklist = (key, progressId) => {
      main.querySelectorAll(`[data-check-key="${key}"]`).forEach(input => input.addEventListener("change", () => {
        const selected = [...main.querySelectorAll(`[data-check-key="${key}"]:checked`)].map(x => Number(x.dataset.checkIndex));
        localStorage.setItem(key, JSON.stringify(selected));
        const progress = document.querySelector(`#${progressId}`); if (progress) progress.textContent = `${selected.length}/${main.querySelectorAll(`[data-check-key="${key}"]`).length}`;
      }));
    };
    bindChecklist("kansai-tools-packing-v1", "packingProgress");
    bindChecklist("kansai-tools-prep-v1", "prepProgress");
    main.querySelectorAll(".tool-reset").forEach(btn => btn.addEventListener("click", () => { localStorage.removeItem(btn.dataset.resetKey); render(); }));
  }

const globalSearch = document.querySelector("#globalSearch");
globalSearch?.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const q = globalSearch.value.trim();
    setView("search", {place:null});
    const params = new URLSearchParams(location.search); params.set("view","search"); if(q) params.set("q",q); else params.delete("q");
    history.replaceState({view:"search",q}, "", `?${params.toString()}`);
    render();
  }
});

const savedTheme = localStorage.getItem("kansai-theme");
document.documentElement.dataset.theme = savedTheme || "light";
const savedUiMode = localStorage.getItem("kansai-ui-mode");
document.documentElement.dataset.uiMode = savedUiMode || "modern";
if (uiModeToggle) {
  const modern = document.documentElement.dataset.uiMode === "modern";
  uiModeToggle.textContent = modern ? "16" : "M";
  uiModeToggle.setAttribute("aria-label", modern ? "Switch to 16-bit mode" : "Switch to modern UI");
  uiModeToggle.setAttribute("title", modern ? "Switch to 16-bit mode" : "Switch to modern UI");
}



const initialParams = new URLSearchParams(location.search);
state.view = initialParams.get("view") || "today";
state.selectedDate = initialParams.get("date") || null;
history.replaceState({view: state.view, date: state.selectedDate}, "", location.href);
state.routeInitialized = true;
render();
