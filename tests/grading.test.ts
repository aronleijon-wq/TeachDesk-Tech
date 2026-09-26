// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { matchStudent } from "@/lib/grading";

const students = [
  { id: "s1", name: "Sara Andersson" },
  { id: "s2", name: "Leo Karlsson" },
  { id: "s3", name: "Åsa Öberg" },
  { id: "s4", name: "Leo Nilsson" },
];

test("a paper is matched by the name written on it, in either order and without accents", () => {
  assert.equal(matchStudent("Sara Andersson", "", students), "s1");
  assert.equal(matchStudent("andersson, sara", "", students), "s1");
  assert.equal(matchStudent("Asa Oberg", "", students), "s3");
  assert.equal(matchStudent("Leo Karlsson 9B", "", students), "s2");
});

test("a first name alone only matches when one student has it", () => {
  assert.equal(matchStudent("Sara", "", students), "s1");
  assert.equal(matchStudent("Leo", "", students), undefined);
});

test("without a readable name, the file's name is used; otherwise the teacher chooses", () => {
  assert.equal(matchStudent("", "Leo Karlsson.pdf", students), "s2");
  assert.equal(matchStudent("", "leo_nilsson_prov.PDF", students), "s4");
  assert.equal(matchStudent("", "scan_0004.pdf", students), undefined);
});
