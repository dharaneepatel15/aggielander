import ical, { type VEvent } from "node-ical";

// Reads a Google Calendar "secret address in iCal format" and returns its events, with
// recurring ones (like weekly classes) expanded, as Aggielander commitments.

const TZ = "America/Chicago";
const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function local(d: Date) {
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

const text = (v: unknown) =>
  (typeof v === "string" ? v : ((v as { val?: string } | undefined)?.val ?? "")).trim();

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  let url: URL;
  try {
    url = new URL(raw.replace(/^webcal:/, "https:"));
  } catch {
    return Response.json({ error: "That doesn't look like a link." }, { status: 400 });
  }
  // Only Google Calendar iCal feeds, so this endpoint can't be used to fetch arbitrary URLs.
  if (url.protocol !== "https:" || url.hostname !== "calendar.google.com" || !url.pathname.startsWith("/calendar/ical/")) {
    return Response.json({ error: "Paste the “Secret address in iCal format” from Google Calendar settings." }, { status: 400 });
  }

  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) {
    return Response.json({ error: "Google Calendar didn't share that calendar. Check the link and try again." }, { status: 502 });
  }

  const data = ical.sync.parseICS(await res.text());
  const from = new Date(Date.now() - 7 * 864e5);
  const to = new Date(Date.now() + 60 * 864e5);
  const events = [];

  for (const item of Object.values(data)) {
    if (item?.type !== "VEVENT") continue;
    const ev = item as VEvent;
    for (const inst of ical.expandRecurringEvent(ev, { from, to })) {
      const title = text(inst.summary) || "Busy";
      const location = text(ev.location);
      if (inst.isFullDay) {
        // All-day dates carry no time zone; their UTC date is the calendar date.
        const date = new Date(inst.start).toISOString().slice(0, 10);
        events.push({ id: `gcal-${ev.uid}-${date}`, title, date, start: "00:00", end: "23:59", allDay: true, location });
        continue;
      }
      const s = local(new Date(inst.start));
      const e = local(new Date(inst.end ?? inst.start));
      events.push({
        id: `gcal-${ev.uid}-${s.date}T${s.time}`,
        title,
        date: s.date,
        start: s.time,
        // Events that run past midnight end at 23:59 on their first day.
        end: e.date === s.date && e.time > s.time ? e.time : "23:59",
        allDay: false,
        location,
      });
    }
  }

  return Response.json({ events: events.slice(0, 1500) });
}
