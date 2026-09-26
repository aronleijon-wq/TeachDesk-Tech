// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsv } from "@/lib/csv";

test("rows become semicolon-separated lines that Excel reads with Swedish settings", () => {
  const csv = toCsv([
    ["Student", "Derivator (20 p)"],
    ["Åsa Öberg", 15],
    ["Leo Karlsson", "Absent"],
  ]);
  assert.equal(csv, "\uFEFFStudent;Derivator (20 p)\r\nÅsa Öberg;15\r\nLeo Karlsson;Absent");
});

test("cells with separators, quotes or line breaks are quoted", () => {
  assert.equal(
    toCsv([["Prov; del 1", 'Säger "hej"', "Två\nrader"]]),
    '\uFEFF"Prov; del 1";"Säger ""hej""";"Två\nrader"',
  );
});
