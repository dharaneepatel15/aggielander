import { cacheLife } from "next/cache";

// Public JSON feed behind calendar.tamu.edu (LiveWhale). Returns roughly the next ~10 days of events.
const FEED_URL = "https://calendar.tamu.edu/live/json/events/";

type FeedEvent = {
  id: number;
  title: string;
  url: string;
  group_title: string | null;
  date_iso: string;
  date2_iso: string | null;
  is_all_day: number | null;
  is_canceled: number | null;
  is_online: number | null;
  is_starred: number | null;
  summary: string | null;
  description: string | null;
  cost: string | null;
  location: string | null;
  location_title: string | null;
  event_types: string[] | null;
  event_types_audience: string[] | null;
  tags: string[] | null;
};

export type CampusEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD, College Station local date
  start: string; // HH:MM
  end: string; // HH:MM
  allDay: boolean;
  category: "career" | "academic" | "social" | "community";
  location: string;
  description: string;
  host: string; // the posting department or office
  icon: string;
  tag: string;
  url: string;
  types: string[]; // calendar.tamu.edu "Event Types", e.g. Campus Life, Academic Calendar
  audience: string[];
  tags: string[];
  featured: boolean; // starred by the calendar's editors
  price: number | null; // 0 = free, otherwise the lowest listed price in dollars; null = not listed
  priceLabel: string;
  networking: boolean;
  free: boolean; // freebies: food, swag, giveaways
};

// Facility opening hours flood the feed but aren't events.
const NOISE = /\bhours\b/i;

const CATEGORY_RULES: [CampusEvent["category"], RegExp][] = [
  ["career", /\b(careers?|internships?|resumes?|résumés?|jobs?|recruit\w*|networking|employers?|interviews?|linkedin)\b/i],
  ["social", /\b(arts?|music|concerts?|films?|movies?|games?|party|festival|performances?|theat(er|re)|dance|social|trivia|crafts?|yoga|fitness|club)\b/i],
  ["academic", /\b(library|lectures?|seminars?|research|workshops?|class(es)?|thesis|dissertation|writing|tutoring|study|symposium|webinars?|book|course)\b/i],
];
const ICONS: Record<CampusEvent["category"], string> = {
  career: "briefcase",
  academic: "book",
  social: "spark",
  community: "users",
};

const NETWORKING =
  /\b(network(ing)?|mixers?|meet (and|&) greet|receptions?|career fairs?|job fairs?|employers?|recruit(ers?|ing)|industry (panel|night)|connect with|mingle|alumni)\b/i;
const FREEBIES =
  /\b(free (food|lunch|breakfast|dinner|pizza|snacks?|coffee|t-?shirts?|swag|merch|giveaways?)|refreshments|pizza|snacks|treats|cookies|giveaways?|swag|door prizes?|raffle|(lunch|food|breakfast|dinner) (will be )?(provided|served)|complimentary)\b/i;

// Feed fields are mostly HTML strings, but some (like cost) are occasionally numbers.
function decode(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "–")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

// The cost field is free text ("Free", "300", "136 - $190", "10.00 (free for Texas A&M students)").
function parsePrice(raw: unknown): number | null {
  const cost = decode(raw);
  if (!cost) return null;
  if (/free/i.test(cost) && (/student/i.test(cost) || !/\d/.test(cost))) return 0;
  const amounts = [...cost.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
  return amounts.length ? Math.min(...amounts) : null;
}

function toCampusEvent(e: FeedEvent): CampusEvent | null {
  if (e.is_canceled || !e.date_iso) return null;
  const title = decode(e.title ?? "");
  if (!title || NOISE.test(title)) return null;
  const host = decode(e.group_title ?? "Texas A&M");
  // Rec Sports posts facility open times (pools, climbing wall) as location-less "events".
  if (/rec sports/i.test(host) && !e.location_title && !e.location) return null;

  // date_iso is already in College Station local time, e.g. 2026-10-22T14:30:00-05:00
  const date = e.date_iso.slice(0, 10);
  const allDay = Boolean(e.is_all_day);
  const start = allDay ? "00:00" : e.date_iso.slice(11, 16);
  let end = allDay ? "23:59" : e.date2_iso && e.date2_iso.slice(0, 10) === date ? e.date2_iso.slice(11, 16) : "";
  if (!end || end <= start) {
    const [h, m] = start.split(":").map(Number);
    end = h >= 23 ? "23:59" : `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  // A timed listing running 8+ hours is a building or exhibit schedule, not something to put on your day.
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  if (!allDay && minutes(end) - minutes(start) >= 8 * 60) return null;

  const types = (e.event_types ?? []).map(decode).filter(Boolean);
  const description = decode(e.summary || e.description || "").slice(0, 240);
  const fullText = `${title} ${decode(e.summary ?? "")} ${decode(e.description ?? "")}`;
  const text = `${title} ${host} ${description} ${types.join(" ")}`;
  // Title wording wins; fall back to the host, description and event type.
  const category =
    CATEGORY_RULES.find(([, re]) => re.test(title))?.[0] ??
    CATEGORY_RULES.find(([, re]) => re.test(text))?.[0] ??
    "community";
  const url = e.url?.startsWith("https://calendar.tamu.edu/") ? e.url : "https://calendar.tamu.edu/";
  const price = parsePrice(e.cost);

  return {
    id: `tamu-${e.id}`,
    title,
    date,
    start,
    end,
    allDay,
    category,
    location: decode(e.location_title || e.location || "") || (e.is_online ? "Online" : "See event page"),
    description: description || "See the event page for details.",
    host,
    icon: ICONS[category],
    tag: types[0] || host,
    url,
    types,
    audience: (e.event_types_audience ?? []).map(decode).filter(Boolean),
    tags: (e.tags ?? []).map(decode).filter(Boolean),
    featured: Boolean(e.is_starred),
    price,
    priceLabel: price === null ? "" : price === 0 ? "Free" : `From $${price}`,
    networking: NETWORKING.test(fullText) || types.includes("Open Houses & Receptions"),
    free: FREEBIES.test(fullText),
  };
}

async function getCampusEvents(): Promise<CampusEvent[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  try {
    const res = await fetch(FEED_URL, { headers: { "User-Agent": "Aggielander/1.0" } });
    if (!res.ok) return [];
    const feed = (await res.json()) as FeedEvent[];
    return feed
      .map(toCampusEvent)
      .filter((e): e is CampusEvent => e !== null)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  } catch (err) {
    console.error("Failed to load calendar.tamu.edu events", err);
    return [];
  }
}

export async function GET() {
  const events = await getCampusEvents();
  return Response.json({ source: "calendar.tamu.edu", events });
}
