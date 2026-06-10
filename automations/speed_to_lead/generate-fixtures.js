import { faker } from "@faker-js/faker";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "fixtures");
const N = 50;

const SERVICES = [
  "AC repair",
  "AC maintenance",
  "Heat pump service",
  "Furnace repair",
  "No cool / emergency",
  "Ductless mini-split install",
  "Thermostat replacement",
  "Indoor air quality assessment",
];

const UTM_SOURCES = [
  "google_lsa",
  "google_organic",
  "facebook",
  "direct",
  "referral",
  "email_campaign",
  undefined,
];

function iso(d) {
  return d.toISOString();
}

function randomLeadSubmitted() {
  const hasEmail = faker.datatype.boolean(0.85);
  const hasBudget = faker.datatype.boolean(0.6);
  const hasUtm = faker.datatype.boolean(0.7);
  const row = {
    name: faker.person.fullName(),
    phone: faker.string.numeric(3) + "-" + faker.string.numeric(3) + "-" + faker.string.numeric(4),
    service: faker.helpers.arrayElement(SERVICES),
    timestamp: iso(faker.date.recent({ days: 14 })),
  };
  if (hasEmail) row.email = faker.internet.email();
  if (hasBudget) row.budget = faker.number.int({ min: 150, max: 18000 });
  if (hasUtm) {
    const u = faker.helpers.arrayElement(UTM_SOURCES.filter(Boolean));
    if (u) row.utm_source = u;
  }
  return row;
}

function randomCallCompleted() {
  const outcome = faker.helpers.arrayElement([
    "qualified",
    "voicemail",
    "hangup",
  ]);
  const hasTranscript =
    outcome === "qualified" && faker.datatype.boolean(0.75);
  const row = {
    caller: faker.string.numeric(3) + "-" + faker.string.numeric(3) + "-" + faker.string.numeric(4),
    duration_sec: faker.number.int({ min: 5, max: 2400 }),
    outcome,
    timestamp: iso(faker.date.recent({ days: 14 })),
  };
  if (hasTranscript) {
    row.transcript = faker.lorem.sentences(faker.number.int({ min: 1, max: 3 }));
  }
  return row;
}

function randomAppointmentRequested(leadIds) {
  const urgency = faker.helpers.arrayElement([
    "same-day",
    "next-day",
    "normal",
  ]);
  const base = faker.date.future({ years: 0.02 });
  let start = new Date(base);
  let end = new Date(base);

  if (urgency === "same-day") {
    start.setHours(faker.number.int({ min: 8, max: 12 }), 0, 0, 0);
    end = new Date(start);
    end.setHours(start.getHours() + faker.number.int({ min: 2, max: 5 }));
  } else if (urgency === "next-day") {
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
    end = new Date(start);
    end.setHours(17, 0, 0, 0);
  } else {
    start.setDate(start.getDate() + faker.number.int({ min: 2, max: 10 }));
    start.setHours(10, 0, 0, 0);
    end = new Date(start);
    end.setHours(15, 0, 0, 0);
  }

  const row = {
    lead_id: faker.helpers.arrayElement(leadIds),
    window_start: iso(start),
    window_end: iso(end),
    urgency,
  };
  if (faker.datatype.boolean(0.4)) {
    row.notes = faker.lorem.sentence();
  }
  return row;
}

function main() {
  faker.seed(20260401);

  mkdirSync(FIXTURES, { recursive: true });

  const leadIds = [];
  const leadSubmitted = [];
  for (let i = 0; i < N; i++) {
    leadIds.push(faker.string.uuid());
    leadSubmitted.push(randomLeadSubmitted());
  }

  const callCompleted = Array.from({ length: N }, () => randomCallCompleted());

  const appointmentRequested = Array.from({ length: N }, () =>
    randomAppointmentRequested(leadIds)
  );

  writeFileSync(
    join(FIXTURES, "lead_submitted.json"),
    JSON.stringify(leadSubmitted, null, 2),
    "utf8"
  );
  writeFileSync(
    join(FIXTURES, "call_completed.json"),
    JSON.stringify(callCompleted, null, 2),
    "utf8"
  );
  writeFileSync(
    join(FIXTURES, "appointment_requested.json"),
    JSON.stringify(appointmentRequested, null, 2),
    "utf8"
  );

  console.log(`Wrote ${N} rows each to fixtures/lead_submitted.json, call_completed.json, appointment_requested.json`);
}

main();
