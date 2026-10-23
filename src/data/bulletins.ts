import type { CampusEvent } from "@/app/api/events/route";

// Events and deadlines pulled by hand from TAMU email bulletins (Grad Student Career Newsletter,
// grad engineering updates, GRAD Aggies sessions, ISSS, CSCE grad lists). Update as new issues arrive.

type Entry = {
  date: string;
  title: string;
  start?: string; // omit for all-day items and deadlines
  end?: string;
  location?: string;
  description: string;
  host: string;
  url?: string;
  category?: CampusEvent["category"];
  deadline?: boolean;
  grad?: boolean;
  networking?: boolean;
  free?: boolean;
};

const entries: Entry[] = [
  { date: "2026-10-22", start: "18:00", end: "19:00", title: "Meloy Kickstart: Building With AI", location: "ZACH 415", description: "Build an app, website or business with AI. No experience required; free pizza.", host: "Engineering grad updates", category: "career", free: true },
  { date: "2026-10-23", start: "13:00", end: "14:00", title: "Graduate Students: Job Search Strategies for Uncovering Opportunity", location: "Online", description: "Career Center session for graduate students. Counts toward the GRAD Aggies certificate.", host: "Graduate Student Career Newsletter", url: "http://tx.ag/RGtMpu2", category: "career", grad: true },
  { date: "2026-10-26", start: "09:00", end: "15:00", title: "Between Classes: Federal Resume Reviews & Career Advising", location: "ALLN 2012", description: "Drop in for federal resume reviews and career advising.", host: "Graduate Student Career Newsletter", category: "career", grad: true },
  { date: "2026-10-26", title: "LANL Week: Los Alamos National Lab recruiting (Oct 26–29)", location: "Main campus", description: "Los Alamos National Laboratory networking and hiring event. Submit your resume ahead of time.", host: "CSCE Grads Jobs", category: "career", grad: true, networking: true },
  { date: "2026-10-26", title: "Deadline: Public Policy Internship Program (Fall 2027), 5 pm", description: "Policy internships in Austin and Washington, D.C. Applications due at 5 pm.", host: "Graduate Student Career Newsletter", url: "https://ppip.tamu.edu/", category: "career", deadline: true },
  { date: "2026-10-27", start: "19:00", end: "20:00", title: "The Human Side of Spaceflight: Teamwork and Decision-Making on Artemis II", location: "Virginia Brown Atrium", description: "Former Aggie Trey Perryman, who led Orion's Mission Evaluation Room, on engineering teamwork. Free Raising Cane's.", host: "Engineering grad updates", category: "academic", free: true },
  { date: "2026-10-28", start: "18:30", end: "19:30", title: "SAME Glider Design Challenge", location: "Francis Hall 103", description: "Build and customize a glider in teams; prizes for farthest flight and best design.", host: "Engineering grad updates", category: "social" },
  { date: "2026-10-30", start: "11:30", end: "12:30", title: "Lunch & Learn with Dow", location: "Chevron Rooms, ZACH 297-299", description: "Student Engineers' Council session with Dow. Free Piada; no RSVP needed.", host: "Engineering grad updates", category: "career", networking: true, free: true },
  { date: "2026-10-30", title: "Deadline: Activate Fellowship application, 2 pm", description: "Two-year fellowship for science entrepreneurs: $100K research funding plus a $100K yearly stipend.", host: "Engineering grad updates", category: "career", deadline: true, grad: true },
  { date: "2026-11-01", title: "Deadline: Graduate Student Travel Award (Dec–Feb travel)", description: "Attending a GRAD Aggies session and completing its reflection is required to be eligible.", host: "GRAD Aggies", url: "https://grad.tamu.edu/funding-your-education/travel-awards", category: "academic", deadline: true, grad: true },
  { date: "2026-11-01", title: "Deadline: Aggie Green Fund major grants", description: "Funding for sustainability projects on campus. Microgrants are due 03/01/27.", host: "Engineering grad updates", category: "community", deadline: true },
  { date: "2026-11-16", title: "Deadline: Q-drop (ISSS review for international students)", description: "ISSS reviews every Q-drop request from F-1 students; start early so your status isn't affected.", host: "ISSS", category: "academic", deadline: true, grad: true },
  { date: "2026-11-17", title: "Qualcomm on-campus interviews", description: "Hardware, systems, firmware and test internships. Submit your resume on HireAggies first.", host: "Graduate Student Career Newsletter", category: "career", networking: true },
  { date: "2026-11-19", title: "P&G campus visit for PhD students", location: "Koldus 209", description: "P&G is meeting PhD students who want to move to industry. No registration required.", host: "Graduate Student Career Newsletter", category: "career", grad: true, networking: true },
  { date: "2026-11-30", title: "Deadline: 2027 Energy Policy Fellowship", description: "Paid fellowship at the Texas Capitol (Jan–Jun 2027), $4,100/month. Open to graduate students.", host: "Engineering grad updates", category: "career", deadline: true, grad: true },
  { date: "2026-12-29", title: "Deadline: WSP/TRC Summer 2027 internships", description: "Engineering consulting internships across the U.S. Apply on HireAggies.", host: "Engineering grad updates", category: "career", deadline: true },
];

const ICONS: Record<CampusEvent["category"], string> = { career: "briefcase", academic: "book", social: "spark", community: "users" };

export const bulletinEvents: CampusEvent[] = entries.map((e, i) => {
  const category = e.category ?? "community";
  return {
    id: `mail-${e.date}-${i}`,
    title: e.title,
    date: e.date,
    start: e.start ?? "00:00",
    end: e.end ?? "23:59",
    allDay: !e.start,
    category,
    location: e.location ?? (e.deadline ? "Deadline" : "See bulletin"),
    description: e.description,
    host: e.host,
    icon: e.deadline ? "clock" : ICONS[category],
    tag: e.deadline ? "Deadline · TAMU email" : "From your TAMU email",
    url: e.url ?? "",
    types: [e.deadline ? "Deadlines" : "Email bulletins"],
    audience: e.grad ? ["Students", "Graduate students"] : ["Students"],
    tags: [],
    featured: false,
    price: e.free ? 0 : null,
    priceLabel: e.free ? "Free" : "",
    networking: Boolean(e.networking),
    free: Boolean(e.free),
    grad: Boolean(e.grad),
  };
});
