// Demo dataset for TeachDesk. Clearly separated from real data:
// this module is the single source of seeded demo content.
import type {
  Assignment,
  Attendance,
  CalendarEvent,
  ClassGroup,
  Exam,
  Question,
  Retake,
  Student,
  Workspace,
} from "./types";

const classes: ClassGroup[] = [
  { id: "math3c", name: "Mathematics 3C", subject: "Mathematics", room: "B214" },
  { id: "phys2", name: "Physics 2", subject: "Physics", room: "C104" },
  { id: "soc3", name: "Social Studies 3", subject: "Social Studies", room: "A331" },
];
const classSizes: Record<string, number> = { math3c: 27, phys2: 26, soc3: 28 };

const firstNames = [
  "Sara", "Leo", "William", "Elsa", "Oskar", "Maja", "Hugo", "Alva", "Liam", "Ebba",
  "Noah", "Astrid", "Elias", "Vera", "Axel", "Signe", "Viktor", "Nora", "Isak", "Tuva",
  "Malte", "Linnea", "Filip", "Klara", "Adam", "Stina", "Emil", "Agnes",
];
const lastNames = [
  "Andersson", "Karlsson", "Johansson", "Lindberg", "Nilsson", "Bergström", "Ek", "Holm",
  "Sundqvist", "Dahl", "Öberg", "Falk", "Lund", "Hedlund", "Norén", "Wikström",
  "Sjöberg", "Ahlgren", "Blom", "Strand", "Forsberg", "Rehn", "Malm", "Vikander",
  "Åkesson", "Palm", "Tegnér", "Ryd",
];

function buildStudents(): Student[] {
  const out: Student[] = [];
  classes.forEach((c, ci) => {
    for (let i = 0; i < (classSizes[c.id] ?? 0); i++) {
      const first = firstNames[(i + ci * 7) % firstNames.length]!;
      const last = lastNames[(i * 3 + ci * 5) % lastNames.length]!;
      const seed = (i * 13 + ci * 29) % 20;
      out.push({
        id: `${c.id}-s${i + 1}`,
        name: `${first} ${last}`,
        classId: c.id,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@elev.se`,
        average: Math.round((62 + seed * 1.7) * 10) / 10,
        missingWork: seed === 17 ? 2 : seed === 11 ? 1 : 0,
        attendanceRate: 88 + (seed % 12),
      });
    }
  });
  // Pin the demo names used across the product narrative.
  out[0] = { ...out[0]!, id: "math3c-s1", name: "Sara Andersson", missingWork: 2, average: 74.5 };
  out[1] = { ...out[1]!, id: "math3c-s2", name: "Leo Karlsson", missingWork: 1, average: 68.2 };
  out[2] = { ...out[2]!, id: "math3c-s3", name: "William Johansson", missingWork: 0, average: 81.4 };
  return out;
}

const students: Student[] = buildStudents();

const derivativeQuestions: Question[] = [
  ["Derivatives", "Basic differentiation", "Easy", 3, "Differentiate f(x) = 3x² + 5x − 2.", "f'(x) = 6x + 5", "1p per correct term, 1p for notation", "Apply power rule"],
  ["Derivatives", "Power rule", "Easy", 3, "Differentiate f(x) = x⁵ − 4x³.", "f'(x) = 5x⁴ − 12x²", "Full marks for both terms correct", "Apply power rule"],
  ["Chain rule", "Composite functions", "Medium", 4, "Differentiate f(x) = (2x + 1)⁴.", "f'(x) = 8(2x + 1)³", "2p outer derivative, 2p inner derivative", "Use the chain rule"],
  ["Product rule", "Products of functions", "Medium", 4, "Differentiate f(x) = x²·sin(x).", "f'(x) = 2x·sin(x) + x²·cos(x)", "2p per term", "Use the product rule"],
  ["Quotient rule", "Rational functions", "Medium", 4, "Differentiate f(x) = (x + 1)/(x − 2).", "f'(x) = −3/(x − 2)²", "2p setup, 2p simplification", "Use the quotient rule"],
  ["Tangents", "Tangent lines", "Medium", 3, "Find the tangent line to f(x) = x² at x = 3.", "y = 6x − 9", "1p derivative, 1p point, 1p line", "Interpret derivative geometrically"],
  ["Extrema", "Critical points", "Hard", 4, "Find and classify the extrema of f(x) = x³ − 3x.", "Max at x = −1, min at x = 1", "2p critical points, 2p classification", "Analyse functions with derivatives"],
  ["Applications", "Rate of change", "Medium", 3, "A balloon's volume is V(t) = 4t². How fast is it growing at t = 5 s?", "V'(5) = 40 units/s", "2p derivative, 1p evaluation", "Model change with derivatives"],
  ["Exponentials", "Exponential derivatives", "Medium", 3, "Differentiate f(x) = e^{3x}.", "f'(x) = 3e^{3x}", "2p chain factor, 1p form", "Differentiate exponential functions"],
  ["Logarithms", "Logarithmic derivatives", "Hard", 3, "Differentiate f(x) = ln(x² + 1).", "f'(x) = 2x/(x² + 1)", "2p chain rule, 1p simplification", "Differentiate logarithmic functions"],
  ["Curve sketching", "Monotonicity", "Hard", 4, "Determine where f(x) = x³ − 6x² + 9x is increasing.", "Increasing on x < 1 and x > 3", "2p sign analysis, 2p intervals", "Analyse functions with derivatives"],
  ["Optimisation", "Applied optimisation", "Hard", 0, "A rectangle has perimeter 40 m. Maximise its area.", "10 m × 10 m, area 100 m²", "2p model, 2p derivative, 1p answer", "Solve optimisation problems"],
].map((q, i) => ({
  id: `q${i + 1}`,
  number: i + 1,
  type: (i % 4 === 0 ? "calculation" : i % 4 === 1 ? "short-answer" : i % 4 === 2 ? "open-ended" : "calculation") as Question["type"],
  topic: q[0] as string,
  skill: q[1] as string,
  difficulty: q[2] as Question["difficulty"],
  points: (q[3] as number) || 4,
  prompt: q[4] as string,
  expectedAnswer: q[5] as string,
  gradingCriteria: q[6] as string,
  objective: q[7] as string,
}));

function attendanceFor(classId: string, absentIds: string[], completedScore = true): Attendance[] {
  return students
    .filter((s) => s.classId === classId)
    .map((s, i) => {
      if (absentIds.includes(s.id)) return { studentId: s.id, status: "absent" as const };
      return {
        studentId: s.id,
        status: "completed" as const,
        score: completedScore ? 18 + ((i * 7) % 20) : 0,
        versionId: i % 2 === 0 ? "v-a" : "v-b",
      };
    });
}

const exams: Exam[] = [
  {
    id: "exam-derivatives-1",
    title: "Derivatives — Exam 1",
    subject: "Mathematics",
    classId: "math3c",
    date: "2026-11-12",
    time: "08:30",
    durationMin: 90,
    room: "B214",
    totalPoints: 42,
    status: "needs-grading",
    objectives: [
      "Apply power rule",
      "Use the chain rule",
      "Use the product rule",
      "Analyse functions with derivatives",
      "Model change with derivatives",
      "Solve optimisation problems",
    ],
    versions: [
      {
        id: "v-a",
        label: "Version A",
        origin: "original",
        createdAt: "2026-10-28",
        approved: true,
        questions: derivativeQuestions,
      },
      {
        id: "v-b",
        label: "Version B",
        origin: "ai-generated",
        createdAt: "2026-11-02",
        approved: true,
        equivalenceScore: 96,
        questions: derivativeQuestions.map((q) => ({
          ...q,
          id: `${q.id}-b`,
          prompt: q.prompt.replace(/\d+/g, (n) => String(Number(n) + 1)),
          expectedAnswer: "Equivalent solution — see teacher key",
        })),
      },
    ],
    attendance: attendanceFor("math3c", ["math3c-s1", "math3c-s2", "math3c-s3"]),
  },
  {
    id: "exam-integrals",
    title: "Integrals — Exam 2",
    subject: "Mathematics",
    classId: "math3c",
    date: "2026-12-04",
    time: "10:15",
    durationMin: 90,
    room: "B214",
    totalPoints: 40,
    status: "upcoming",
    objectives: ["Compute definite integrals", "Apply integration to area"],
    versions: [
      { id: "vi-a", label: "Version A", origin: "original", createdAt: "2026-11-18", approved: true, questions: derivativeQuestions.slice(0, 8) },
    ],
    attendance: students.filter((s) => s.classId === "math3c").map((s) => ({ studentId: s.id, status: "pending" as const })),
  },
  {
    id: "exam-electricity",
    title: "Electricity & Circuits",
    subject: "Physics",
    classId: "phys2",
    date: "2026-11-27",
    time: "13:00",
    durationMin: 80,
    room: "C104",
    totalPoints: 32,
    status: "upcoming",
    objectives: ["Apply Ohm's law", "Analyse series and parallel circuits"],
    versions: [
      { id: "ve-a", label: "Version A", origin: "original", createdAt: "2026-11-10", approved: true, questions: derivativeQuestions.slice(0, 9) },
    ],
    attendance: students.filter((s) => s.classId === "phys2").map((s) => ({ studentId: s.id, status: "pending" as const })),
  },
  {
    id: "exam-democracy",
    title: "Democracy & Institutions",
    subject: "Social Studies",
    classId: "soc3",
    date: "2026-10-09",
    time: "09:00",
    durationMin: 100,
    room: "A331",
    totalPoints: 30,
    status: "completed",
    objectives: ["Explain democratic processes", "Compare political systems"],
    versions: [
      { id: "vd-a", label: "Version A", origin: "original", createdAt: "2026-09-25", approved: true, questions: derivativeQuestions.slice(0, 10) },
    ],
    attendance: attendanceFor("soc3", ["soc3-s4"]),
  },
  {
    id: "exam-waves-draft",
    title: "Waves & Optics",
    subject: "Physics",
    classId: "phys2",
    date: "2027-01-15",
    time: "08:30",
    durationMin: 90,
    room: "C104",
    totalPoints: 36,
    status: "draft",
    objectives: ["Describe wave behaviour"],
    versions: [],
    attendance: [],
  },
];

const retakes: Retake[] = [
  { id: "r1", examId: "exam-derivatives-1", studentId: "math3c-s1", status: "needs-scheduling" },
  { id: "r2", examId: "exam-derivatives-1", studentId: "math3c-s2", status: "needs-scheduling" },
  { id: "r3", examId: "exam-derivatives-1", studentId: "math3c-s3", status: "scheduled", date: "2026-11-24", time: "14:30", room: "B210", versionId: "v-b" },
  { id: "r4", examId: "exam-democracy", studentId: "soc3-s4", status: "scheduled", date: "2026-10-22", time: "15:00", room: "A331", versionId: "vd-a" },
];

const assignments: Assignment[] = [
  { id: "a1", title: "Derivative problem set", subject: "Mathematics", classId: "math3c", due: "2026-11-18", submitted: 22, total: 27, toGrade: 9 },
  { id: "a2", title: "Lab report — Ohm's law", subject: "Physics", classId: "phys2", due: "2026-11-20", submitted: 19, total: 26, toGrade: 6 },
  { id: "a3", title: "Essay — Swedish democracy", subject: "Social Studies", classId: "soc3", due: "2026-11-14", submitted: 26, total: 28, toGrade: 3 },
  { id: "a4", title: "Integral practice", subject: "Mathematics", classId: "math3c", due: "2026-12-01", submitted: 5, total: 27, toGrade: 0 },
];

const todayEvents: CalendarEvent[] = [
  { id: "e1", date: "today", time: "08:30", title: "Mathematics 3C — Derivatives review", classId: "math3c", room: "B214", kind: "lesson", students: 27 },
  { id: "e2", date: "today", time: "10:15", title: "Physics 2 — Circuit lab", classId: "phys2", room: "C104", kind: "lesson", students: 26 },
  { id: "e3", date: "today", time: "13:00", title: "Planning", kind: "planning" },
  { id: "e4", date: "today", time: "14:30", title: "Retake — Mathematics 3C", classId: "math3c", room: "B210", kind: "retake", students: 3 },
];

/** A fresh copy of the demo workspace, safe to edit. */
export function createDemoWorkspace(): Workspace {
  return structuredClone({ classes, students, exams, retakes, assignments, events: todayEvents });
}
