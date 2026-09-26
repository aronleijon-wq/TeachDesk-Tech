// Matching an uploaded test to a student in the class: by the name the student wrote on
// the paper, or else by the file's name. Kept free of React so it can be tested.

/** Lower case, without accents or punctuation, as separate words. */
const words = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

/** The one student whose whole name is there, in any order and among other words; else undefined. */
function matchName(written: string, students: { id: string; name: string }[]) {
  const given = words(written);
  if (given.length === 0) return undefined;
  const named = students.filter((s) => words(s.name).every((w) => given.includes(w)));
  if (named.length === 1) return named[0]!.id;
  // Just a first name, like "Leo", when only one student has it.
  if (given.length === 1) {
    const byFirstName = students.filter((s) => words(s.name)[0] === given[0]);
    if (byFirstName.length === 1) return byFirstName[0]!.id;
  }
  return undefined;
}

/**
 * The student a paper belongs to: the name written on it, or else the file's name (like
 * "Leo Karlsson.pdf"). Undefined when it isn't clear, so the teacher chooses.
 */
export function matchStudent(
  writtenName: string,
  fileName: string,
  students: { id: string; name: string }[],
): string | undefined {
  return (
    matchName(writtenName, students) ?? matchName(fileName.replace(/\.[a-z0-9]+$/i, ""), students)
  );
}
