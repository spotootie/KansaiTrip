import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const trip = JSON.parse(fs.readFileSync(path.join(root,'data/trip.json'),'utf8'));
const placeIndex = JSON.parse(fs.readFileSync(path.join(root,'data/place-index.json'),'utf8'));

const official = {
  'koko-hotel-shinsekai':'https://koko-hotels.com/osaka-shinsekai/',
  'kix':'https://www.kansai-airport.or.jp/en/',
  'umeda-sky-building':'https://www.skybldg.co.jp/en/',
  'tennoji-zoo':'https://www.tennojizoo.jp/en/',
  'minoh-park':'https://www.mino-park.jp/',
  'osaka-castle':'https://www.osakacastle.net/english/',
  'togetsukyo-bridge':'https://kyoto.travel/en/areas/arashiyama.html',
  'arashiyama-bamboo-grove':'https://kyoto.travel/en/areas/arashiyama.html',
  'saga-toriimoto':'https://kyoto.travel/en/areas/arashiyama.html',
  'otagi-nenbutsuji':'https://www.otagiji.com/',
  'adashino-nenbutsuji':'https://www.nenbutsuji.jp/',
  'kimono-forest':'https://www.kyotoarashiyama.jp/en/',
  'nijo-castle':'https://nijo-jocastle.city.kyoto.lg.jp/?lang=en',
  'kyoto-manga-museum':'https://kyotomm.jp/en/',
  'kyoto-station':'https://www.kyoto-station-building.co.jp/lang/en/',
  'hirakata-park':'https://www.hirakatapark.co.jp/en/',
  'nintendo-kyoto':'https://www.nintendo.com/jp/en/official/kyoto/',
  'nintendo-museum':'https://museum.nintendo.com/en/index.html',
  'andot-kyoto':'https://andotkyoto.com/',
  'yasaka-shrine':'https://www.yasaka-jinja.or.jp/en/',
  'kyoto-aquarium':'https://www.kyoto-aquarium.com/en/',
  'dotonbori':'https://osaka-info.jp/en/spot/dotonbori/',
  'shinsaibashi-parco':'https://shinsaibashi.parco.jp.e.am.hp.transer.com/',
  'universal-studios-japan':'https://www.usj.co.jp/web/en/us/',
  'hozenji':'https://osaka-info.jp/en/spot/hozenji/',
  'kuromon-market':'https://kuromon.com/en/',
  'nipponbashi-denden-town':'https://www.denden-town.or.jp/en/',
  'shinsekai':'https://osaka-info.jp/en/spot/shinsekai/',
  'tsutenkaku':'https://www.tsutenkaku.co.jp/Guide-pdf/mishiran-guide-en.pdf',
  'round1-sennichimae':'https://www.round1.co.jp/shop/tenpo/osaka-sennichimae.html',
  'kiddy-land-umeda':'https://www.kiddyland.co.jp/shoplist/umeda/',
  'hep-five':'https://www.hepfive.jp/',
  'shinsaibashi-maruhana':'https://www.maruhana.jp/'
};

const wikiDirect = {
  'umeda-sky-building':'https://en.wikipedia.org/wiki/Umeda_Sky_Building',
  'tennoji-zoo':'https://en.wikipedia.org/wiki/Tennoji_Zoo',
  'osaka-castle':'https://en.wikipedia.org/wiki/Osaka_Castle',
  'togetsukyo-bridge':'https://en.wikipedia.org/wiki/Togetsuky%C5%8D_Bridge',
  'arashiyama-bamboo-grove':'https://en.wikipedia.org/wiki/Arashiyama_Bamboo_Grove',
  'nijo-castle':'https://en.wikipedia.org/wiki/Nij%C5%8D_Castle',
  'kyoto-manga-museum':'https://en.wikipedia.org/wiki/Kyoto_International_Manga_Museum',
  'hirakata-park':'https://en.wikipedia.org/wiki/Hirakata_Park',
  'nintendo-museum':'https://en.wikipedia.org/wiki/Nintendo_Museum',
  'yasaka-shrine':'https://en.wikipedia.org/wiki/Yasaka_Shrine',
  'kyoto-aquarium':'https://en.wikipedia.org/wiki/Kyoto_Aquarium',
  'universal-studios-japan':'https://en.wikipedia.org/wiki/Universal_Studios_Japan',
  'kuromon-market':'https://en.wikipedia.org/wiki/Kuromon_Ichiba_Market',
  'shinsekai':'https://en.wikipedia.org/wiki/Shinsekai',
  'tsutenkaku':'https://en.wikipedia.org/wiki/Ts%C5%ABtenkaku'
};

const known = {
  'umeda-sky-building': {hours:'Typically 09:30–22:30; last admission is earlier. Verify the date before visiting.', admission:'Paid; observatory admission applies.', duration:'1–2 hours', best:'Late afternoon into evening for views and city lights.'},
  'tennoji-zoo': {hours:'Typically daytime hours; closed on scheduled weekly/holiday dates. Verify the December 1 schedule.', admission:'Paid; verify current resident/visitor rates.', duration:'2–3 hours', best:'Morning to early afternoon, especially in cooler weather.'},
  'minoh-park': {hours:'Outdoor park; generally accessible throughout the day. Individual facilities have their own hours.', admission:'Park access is generally free; paid facilities may differ.', duration:'2–4 hours', best:'Morning or early afternoon for the waterfall walk; autumn foliage can be especially attractive.'},
  'osaka-castle': {hours:'Main tower typically 09:00–17:00; last admission earlier. Park grounds have broader access.', admission:'Paid for the main tower/museum; grounds generally free.', duration:'2–3 hours', best:'Morning or late afternoon; allow extra time for the surrounding park.'},
  'togetsukyo-bridge': {hours:'Outdoor public landmark; bridge access is generally available throughout the day.', admission:'Free.', duration:'20–40 minutes', best:'Early morning or late afternoon to reduce crowding.'},
  'arashiyama-bamboo-grove': {hours:'Outdoor public path; generally accessible throughout the day.', admission:'Free.', duration:'30–60 minutes', best:'Early morning for a quieter walk.'},
  'saga-toriimoto': {hours:'Historic street; outdoor access is generally open throughout the day, while shops/temples vary.', admission:'Street access is free; individual sites may charge admission.', duration:'45–90 minutes', best:'Morning or late afternoon for a quieter atmosphere.'},
  'otagi-nenbutsuji': {hours:'Typically 08:00–16:30; verify seasonal closing details.', admission:'Paid temple admission.', duration:'45–75 minutes', best:'Morning or mid-afternoon.'},
  'adashino-nenbutsuji': {hours:'Typically 09:00–16:30; verify seasonal schedule.', admission:'Paid temple admission.', duration:'45–75 minutes', best:'Morning or mid-afternoon.'},
  'kimono-forest': {hours:'Outdoor art installation at Arashiyama Station; access follows station/public-area operation.', admission:'Free.', duration:'15–30 minutes', best:'Evening can be atmospheric when the cylinders are illuminated.'},
  'nijo-castle': {hours:'Typically 08:45–17:00; last admission earlier. Some areas may have separate hours.', admission:'Paid.', duration:'2–3 hours', best:'Morning for a more comfortable visit.'},
  'kyoto-manga-museum': {hours:'Typically 10:00–17:00; verify closure days and last admission.', admission:'Paid.', duration:'1.5–3 hours', best:'Late morning or afternoon.'},
  'hirakata-park': {hours:'Seasonal hours and attraction operations vary; verify the December 6 schedule.', admission:'Paid; attraction rides may have separate pricing.', duration:'3–5 hours', best:'Arrive near opening and check the seasonal ride calendar.'},
  'nintendo-museum': {hours:'Timed-entry operation; verify the ticket date, entry time and current museum hours.', admission:'Paid; advance reservation/ticketing is required.', duration:'2–3 hours', best:'Use the reserved entry time and allow time for exhibits.'},
  'andot-kyoto': {hours:'Booked session: Dec 7, 10:00–16:30. Follow the booking confirmation for exact arrival instructions.', admission:'Booked service; price per reservation.', duration:'30–90 minutes', best:'Arrive with buffer before the booked time.'},
  'yasaka-shrine': {hours:'Shrine grounds are generally accessible; individual facilities/events vary.', admission:'Free for shrine grounds; special areas/events may differ.', duration:'30–60 minutes', best:'Early morning or evening.'},
  'kyoto-aquarium': {hours:'Typically daytime hours; verify the Dec 8 schedule and last admission.', admission:'Paid.', duration:'1.5–2.5 hours', best:'Morning or early afternoon.'},
  'dotonbori': {hours:'Outdoor entertainment/dining district; access is continuous, but businesses set their own hours.', admission:'Free to explore.', duration:'1–2 hours', best:'Evening for the illuminated signs; expect crowds.'},
  'universal-studios-japan': {hours:'Opening hours vary by date and season. Check the official calendar for Dec 9.', admission:'Paid; dated admission/tickets and optional timed/express products may apply.', duration:'Full day', best:'Arrive before park opening and prioritize timed attractions.'},
  'hozenji': {hours:'Temple precinct is generally accessible; shops/restaurants nearby have separate hours.', admission:'Free.', duration:'20–40 minutes', best:'Evening for the lantern-lit atmosphere.'},
  'kuromon-market': {hours:'Individual stalls vary; many operate from morning into afternoon. Verify individual vendors.', admission:'Free to browse; food purchases extra.', duration:'1–2 hours', best:'Morning, especially for breakfast/snacks.'},
  'nipponbashi-denden-town': {hours:'Street district; individual shops vary, commonly late morning to evening.', admission:'Free to explore.', duration:'2–4 hours', best:'Late morning onward when shops are open.'},
  'shinsekai': {hours:'Outdoor district; businesses vary.', admission:'Free to explore.', duration:'1–2 hours', best:'Late afternoon into evening.'},
  'tsutenkaku': {hours:'Typically 09:00–21:00; last admission earlier. Verify current schedule.', admission:'Paid observation facilities.', duration:'45–90 minutes', best:'Late afternoon/evening.'},
  'round1-sennichimae': {hours:'Extended hours; individual attractions have separate operating schedules.', admission:'Paid by activity/package.', duration:'1–3 hours', best:'Evening is convenient for the entertainment district.'},
  'kiddy-land-umeda': {hours:'Retail hours vary; verify the current store schedule.', admission:'Free entry.', duration:'45–90 minutes', best:'Late morning/afternoon.'},
  'hep-five': {hours:'Retail and attractions have separate schedules; verify before visiting.', admission:'Free entry to shopping areas; attractions may charge.', duration:'1–2 hours', best:'Late afternoon/evening.'},
  'shinsaibashi-maruhana': {hours:'Lunch-focused; the itinerary notes lunch only. Verify opening and booking requirements.', admission:'Paid buffet; itinerary reference price ¥7,500.', duration:'1–2 hours', best:'Lunch reservation window.'}
};

function wikiUrl(name,id){ return wikiDirect[id] || `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`; }
function mapsUrl(name, city){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${city}, Japan`)}`; }
function overview(p){
  const cat = p.category;
  const templates = {
    attraction:`A ${cat} stop in ${p.city} included in your Kansai itinerary. Use this entry for trip context, practical planning and the best external references before you go.`,
    shopping:`A shopping stop in ${p.city} included in your Kansai itinerary. Check the store's current hours and stock-sensitive details before setting out.`,
    food:`A food and dining stop in ${p.city} included in your Kansai itinerary. Hours, queues, menus and reservation policies can change, so confirm close to the visit.`,
    hotel:`A lodging/base point in ${p.city} used by the itinerary. Confirm check-in/out instructions and the exact address from your booking before travel.`,
    transit:`A transport point in ${p.city} used to connect itinerary segments. Use live navigation for current service status and platform information.`,
    airport:`A major airport used by the trip. Use the airline/airport source for current terminal, check-in and departure information.`,
    experience:`A booked/participatory experience in ${p.city}. Keep the booking confirmation handy and verify arrival instructions.`,
    entertainment:`An entertainment stop in ${p.city}. Check the current operating schedule and any reservation/package requirements before visiting.`,
    choice:`An itinerary choice point. Review the available alternatives and confirm which option you will take before the day.`,
    transition:`A transition point in the itinerary. Allow extra time for the change of base or travel segment.`
  };
  return templates[cat] || `A ${p.category} stop in ${p.city} included in your Kansai itinerary.`;
}
function practical(p){
  if (known[p.id]) return known[p.id];
  if (p.category==='food') return {hours:'Hours vary; verify the current schedule on the official source or Google Maps before visiting.', admission:'No admission; food/drink purchased separately.', duration:'45–90 minutes', best:'Use the itinerary timing; avoid peak queues when possible.'};
  if (p.category==='shopping') return {hours:'Retail hours vary; verify the current store schedule before visiting.', admission:'Free entry; purchases extra.', duration:'30–90 minutes', best:'Late morning through afternoon, when most shops are open.'};
  if (p.category==='hotel') return {hours:'Check-in/out follow your booking confirmation.', admission:'Not applicable.', duration:'As needed for stay/check-in.', best:'Follow the booking window.'};
  if (p.category==='transit' || p.category==='airport') return {hours:'Service/terminal hours vary; verify current operator information.', admission:'Not applicable; fares depend on the journey.', duration:'Allow enough transfer buffer for the itinerary.', best:'Follow the itinerary and live service information.'};
  if (p.category==='experience') return {hours:'Booking-dependent; verify the reservation confirmation.', admission:'Booking-dependent.', duration:'Booking-dependent.', best:'Arrive early enough for check-in.'};
  if (p.category==='entertainment') return {hours:'Operating hours vary by attraction/activity; verify before visiting.', admission:'Activity-dependent.', duration:'1–3 hours', best:'Later afternoon/evening can work well, subject to opening hours.'};
  if (p.category==='choice') return {hours:'Varies by selected option.', admission:'Varies by selected option.', duration:'Varies by selected option.', best:'Choose based on weather, opening hours and transit convenience.'};
  return {hours:'Verify current opening hours before visiting.', admission:'Verify current admission policy before visiting.', duration:'Allow about 1–2 hours unless your itinerary suggests otherwise.', best:'Follow the itinerary timing and adjust for crowding/weather.'};
}

const encyclopedia = {};
for (const p of trip.places) {
  const occ = (placeIndex[p.id] || []).map((o,i) => {
    const day = trip.parts.flatMap(part=>part.days.map(d=>({...d,partId:part.id,partTitle:part.title}))).find(d=>d.date===o.date && d.title===o.dayTitle);
    const stops = day?.stops || [];
    const idx = stops.findIndex(s=>s.placeId===p.id && s.title===o.stopTitle);
    const prev = idx>0 ? stops[idx-1] : null;
    const next = idx>=0 && idx<stops.length-1 ? stops[idx+1] : null;
    return {date:o.date, dayTitle:o.dayTitle, stopTitle:o.stopTitle, note:o.note||'', order:o.order, previous:prev?.placeId ? {placeId:prev.placeId,title:prev.title} : null, next:next?.placeId ? {placeId:next.placeId,title:next.title} : null, occurrenceIndex:i};
  });
  const pr = practical(p);
  encyclopedia[p.id] = {
    placeId:p.id, name:p.name, city:p.city, category:p.category,
    overview:overview(p), practical:pr,
    location:{label:p.location?.address || `${p.city}, Japan`, verified:Boolean(p.location), coordinates:p.location ? {lat:p.location.lat,lng:p.location.lng} : null},
    resources:{wikipedia:wikiUrl(p.name,p.id), official:official[p.id] || null, maps:mapsUrl(p.name,p.city)},
    occurrences:occ,
    sourceNote: p.location ? 'Location verified in the app location layer.' : 'Hours, admission and exact location should be verified before the visit; the app does not invent missing facts.'
  };
}

fs.writeFileSync(path.join(root,'data/encyclopedia-index.json'), JSON.stringify(encyclopedia,null,2)+'\n');
fs.writeFileSync(path.join(root,'data/encyclopedia-index.js'), `export const encyclopediaIndex = ${JSON.stringify(encyclopedia,null,2)};\n`);
console.log(`Built ${Object.keys(encyclopedia).length} encyclopedia records.`);
