// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { accessFor, accessLabel, formatPrice, plans, yearlyOffer } from "@/lib/pricing";

const now = new Date("2026-09-26T12:00:00Z");
const inDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
const pilot = (days: number) => ({ status: "pilot", pilotEndsAt: inDays(days) });

test("paying for Pro gives Pro, with or without a trial", () => {
  assert.deepEqual(accessFor("pro", inDays(-30), [], now), {
    level: "pro",
    via: "plan",
    daysLeft: null,
  });
  assert.equal(accessLabel(accessFor("pro", inDays(5), [], now), "en"), "Pro");
});

test("a running trial gives Pro and counts the days left", () => {
  assert.deepEqual(accessFor("free", inDays(14), [], now), {
    level: "pro",
    via: "trial",
    daysLeft: 14,
  });
  assert.deepEqual(accessFor("free", inDays(0.2), [], now), {
    level: "pro",
    via: "trial",
    daysLeft: 1,
  });
  assert.equal(
    accessLabel(accessFor("free", inDays(12), [], now), "en"),
    "Pro trial · 12 days left",
  );
  assert.equal(accessLabel(accessFor("free", inDays(1), [], now), "en"), "Pro trial · 1 day left");
});

test("after the trial the teacher is on the free plan", () => {
  assert.deepEqual(accessFor("free", inDays(-1), [], now), {
    level: "free",
    via: null,
    daysLeft: null,
  });
  assert.equal(accessLabel(accessFor("free", inDays(-1), [], now), "en"), "Free");
});

test("a school's running pilot gives Pro and wins over the teacher's own trial", () => {
  assert.deepEqual(accessFor("free", inDays(10), [pilot(21)], now), {
    level: "pro",
    via: "pilot",
    daysLeft: 21,
  });
  assert.equal(
    accessLabel(accessFor("free", inDays(-1), [pilot(3)], now), "en"),
    "School pilot · 3 days left",
  );
  // The longest-running pilot counts when a teacher is in more than one school.
  assert.equal(accessFor("free", inDays(-1), [pilot(3), pilot(40)], now).daysLeft, 40);
});

test("an ended pilot gives nothing; a paying school gives Enterprise", () => {
  assert.equal(accessFor("free", inDays(-1), [pilot(-2)], now).level, "free");
  assert.equal(
    accessFor("free", inDays(5), [{ status: "ended", pilotEndsAt: null }], now).via,
    "trial",
  );
  const paying = accessFor(
    "free",
    inDays(-1),
    [pilot(-2), { status: "active", pilotEndsAt: null }],
    now,
  );
  assert.deepEqual(paying, { level: "pro", via: "school", daysLeft: null });
  assert.equal(accessLabel(paying, "en"), "Enterprise");
});

test("prices show in Swedish style, with the yearly offer where there is one", () => {
  const pro = plans("en").find((p) => p.name === "Pro")!;
  assert.equal(formatPrice(pro.price, "en").replace(/\s/g, " "), "229 kr");
  assert.equal(yearlyOffer(pro, "en")?.replace(/\s/g, " "), "or 2 290 kr per year — 2 months free");
  assert.equal(formatPrice(null, "en"), "Let's talk");
  assert.equal(
    yearlyOffer(
      plans("en").find((p) => p.name === "Free")!,
      "en",
    ),
    null,
  );
});

test("plans and labels read in Swedish too", () => {
  const [free, pro, school] = plans("sv");
  assert.deepEqual([free?.title, pro?.title, school?.title], ["Gratis", "Pro", "Skola"]);
  assert.equal(
    yearlyOffer(pro!, "sv")?.replace(/\s/g, " "),
    "eller 2 290 kr per år — 2 månader gratis",
  );
  assert.equal(accessLabel(accessFor("free", inDays(1), [], now), "sv"), "Gratis Pro · 1 dag kvar");
  assert.equal(
    accessLabel(accessFor("free", inDays(-1), [pilot(3)], now), "sv"),
    "Skolpilot · 3 dagar kvar",
  );
  assert.equal(accessLabel(accessFor("free", inDays(-1), [], now), "sv"), "Gratis");
});
