// Demo dataset for TeachDesk. Clearly separated from real data:
// this module is the single source of seeded demo content. It comes in Swedish and English,
// in the language the teacher uses when the demo is created.
import type { Language } from "./messages";
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

type ClassId = "math3c" | "phys2" | "soc3";

const classRooms: Record<ClassId, string> = { math3c: "B214", phys2: "C104", soc3: "A331" };
const classSizes: Record<ClassId, number> = { math3c: 27, phys2: 26, soc3: 28 };
const classIds = Object.keys(classRooms) as ClassId[];

const firstNames = [
  "Sara",
  "Leo",
  "William",
  "Elsa",
  "Oskar",
  "Maja",
  "Hugo",
  "Alva",
  "Liam",
  "Ebba",
  "Noah",
  "Astrid",
  "Elias",
  "Vera",
  "Axel",
  "Signe",
  "Viktor",
  "Nora",
  "Isak",
  "Tuva",
  "Malte",
  "Linnea",
  "Filip",
  "Klara",
  "Adam",
  "Stina",
  "Emil",
  "Agnes",
];
const lastNames = [
  "Andersson",
  "Karlsson",
  "Johansson",
  "Lindberg",
  "Nilsson",
  "Bergström",
  "Ek",
  "Holm",
  "Sundqvist",
  "Dahl",
  "Öberg",
  "Falk",
  "Lund",
  "Hedlund",
  "Norén",
  "Wikström",
  "Sjöberg",
  "Ahlgren",
  "Blom",
  "Strand",
  "Forsberg",
  "Rehn",
  "Malm",
  "Vikander",
  "Åkesson",
  "Palm",
  "Tegnér",
  "Ryd",
];

function buildStudents(): Student[] {
  const out: Student[] = [];
  classIds.forEach((classId, ci) => {
    for (let i = 0; i < classSizes[classId]; i++) {
      const first = firstNames[(i + ci * 7) % firstNames.length]!;
      const last = lastNames[(i * 3 + ci * 5) % lastNames.length]!;
      const seed = (i * 13 + ci * 29) % 20;
      out.push({
        id: `${classId}-s${i + 1}`,
        name: `${first} ${last}`,
        classId,
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
  out[2] = {
    ...out[2]!,
    id: "math3c-s3",
    name: "William Johansson",
    missingWork: 0,
    average: 81.4,
  };
  return out;
}

const students: Student[] = buildStudents();

/** A question's wording in one language. */
interface QuestionText {
  topic: string;
  skill: string;
  prompt: string;
  answer: string;
  criteria: string;
  objective: string;
}

/** What stays the same in both languages. */
type QuestionShape = [type: Question["type"], difficulty: Question["difficulty"], points: number];

interface ExamText {
  title: string;
  objectives: string[];
  questions: QuestionText[];
}

interface DemoTexts {
  classes: Record<ClassId, { name: string; subject: string }>;
  derivatives: ExamText & { equivalentAnswer: string };
  integrals: ExamText;
  electricity: ExamText;
  democracy: ExamText;
  waves: Omit<ExamText, "questions">;
  assignments: [string, string, string, string];
  events: { mathLesson: string; physicsLab: string; planning: string; retake: string };
}

const derivativeShapes: QuestionShape[] = [
  ["calculation", "Easy", 3],
  ["short-answer", "Easy", 3],
  ["open-ended", "Medium", 4],
  ["calculation", "Medium", 4],
  ["calculation", "Medium", 4],
  ["short-answer", "Medium", 3],
  ["open-ended", "Hard", 4],
  ["calculation", "Medium", 3],
  ["calculation", "Medium", 3],
  ["short-answer", "Hard", 3],
  ["open-ended", "Hard", 4],
  ["calculation", "Hard", 4],
];
const integralShapes: QuestionShape[] = [
  ["calculation", "Easy", 3],
  ["short-answer", "Easy", 2],
  ["calculation", "Medium", 4],
  ["calculation", "Medium", 4],
  ["open-ended", "Hard", 5],
];
const electricityShapes: QuestionShape[] = [
  ["calculation", "Easy", 2],
  ["calculation", "Medium", 3],
  ["calculation", "Medium", 3],
  ["short-answer", "Easy", 2],
  ["open-ended", "Hard", 4],
];
const democracyShapes: QuestionShape[] = [
  ["short-answer", "Easy", 2],
  ["short-answer", "Easy", 2],
  ["open-ended", "Medium", 4],
  ["open-ended", "Medium", 4],
  ["open-ended", "Hard", 6],
];

const q = (
  topic: string,
  skill: string,
  prompt: string,
  answer: string,
  criteria: string,
  objective: string,
): QuestionText => ({ topic, skill, prompt, answer, criteria, objective });

const texts: Record<Language, DemoTexts> = {
  en: {
    classes: {
      math3c: { name: "Mathematics 3C", subject: "Mathematics" },
      phys2: { name: "Physics 2", subject: "Physics" },
      soc3: { name: "Social Studies 3", subject: "Social Studies" },
    },
    derivatives: {
      title: "Derivatives — Exam 1",
      objectives: [
        "Apply power rule",
        "Use the chain rule",
        "Use the product rule",
        "Analyse functions with derivatives",
        "Model change with derivatives",
        "Solve optimisation problems",
      ],
      equivalentAnswer: "Equivalent solution — see teacher key",
      questions: [
        q(
          "Derivatives",
          "Basic differentiation",
          "Differentiate f(x) = 3x² + 5x − 2.",
          "f'(x) = 6x + 5",
          "1p per correct term, 1p for notation",
          "Apply power rule",
        ),
        q(
          "Derivatives",
          "Power rule",
          "Differentiate f(x) = x⁵ − 4x³.",
          "f'(x) = 5x⁴ − 12x²",
          "Full marks for both terms correct",
          "Apply power rule",
        ),
        q(
          "Chain rule",
          "Composite functions",
          "Differentiate f(x) = (2x + 1)⁴.",
          "f'(x) = 8(2x + 1)³",
          "2p outer derivative, 2p inner derivative",
          "Use the chain rule",
        ),
        q(
          "Product rule",
          "Products of functions",
          "Differentiate f(x) = x²·sin(x).",
          "f'(x) = 2x·sin(x) + x²·cos(x)",
          "2p per term",
          "Use the product rule",
        ),
        q(
          "Quotient rule",
          "Rational functions",
          "Differentiate f(x) = (x + 1)/(x − 2).",
          "f'(x) = −3/(x − 2)²",
          "2p setup, 2p simplification",
          "Use the quotient rule",
        ),
        q(
          "Tangents",
          "Tangent lines",
          "Find the tangent line to f(x) = x² at x = 3.",
          "y = 6x − 9",
          "1p derivative, 1p point, 1p line",
          "Interpret derivative geometrically",
        ),
        q(
          "Extrema",
          "Critical points",
          "Find and classify the extrema of f(x) = x³ − 3x.",
          "Max at x = −1, min at x = 1",
          "2p critical points, 2p classification",
          "Analyse functions with derivatives",
        ),
        q(
          "Applications",
          "Rate of change",
          "A balloon's volume is V(t) = 4t². How fast is it growing at t = 5 s?",
          "V'(5) = 40 units/s",
          "2p derivative, 1p evaluation",
          "Model change with derivatives",
        ),
        q(
          "Exponentials",
          "Exponential derivatives",
          "Differentiate f(x) = e^{3x}.",
          "f'(x) = 3e^{3x}",
          "2p chain factor, 1p form",
          "Differentiate exponential functions",
        ),
        q(
          "Logarithms",
          "Logarithmic derivatives",
          "Differentiate f(x) = ln(x² + 1).",
          "f'(x) = 2x/(x² + 1)",
          "2p chain rule, 1p simplification",
          "Differentiate logarithmic functions",
        ),
        q(
          "Curve sketching",
          "Monotonicity",
          "Determine where f(x) = x³ − 6x² + 9x is increasing.",
          "Increasing on x < 1 and x > 3",
          "2p sign analysis, 2p intervals",
          "Analyse functions with derivatives",
        ),
        q(
          "Optimisation",
          "Applied optimisation",
          "A rectangle has perimeter 40 m. Maximise its area.",
          "10 m × 10 m, area 100 m²",
          "2p model, 1p derivative, 1p answer",
          "Solve optimisation problems",
        ),
      ],
    },
    integrals: {
      title: "Integrals — Exam 2",
      objectives: ["Compute definite integrals", "Apply integration to area"],
      questions: [
        q(
          "Definite integrals",
          "Polynomials",
          "Calculate ∫₀² (3x² + 1) dx.",
          "10",
          "1p antiderivative, 1p substitution, 1p answer",
          "Compute definite integrals",
        ),
        q(
          "Antiderivatives",
          "Power rule",
          "Give an antiderivative of f(x) = 4x³.",
          "F(x) = x⁴ + C",
          "2p for a correct antiderivative",
          "Compute definite integrals",
        ),
        q(
          "Area",
          "Area under a curve",
          "Find the area between y = x² and the x-axis for 0 ≤ x ≤ 3.",
          "9 area units",
          "2p integral, 2p calculation",
          "Apply integration to area",
        ),
        q(
          "Definite integrals",
          "Exponential functions",
          "Calculate ∫₀¹ eˣ dx.",
          "e − 1 ≈ 1.72",
          "2p antiderivative, 2p answer",
          "Compute definite integrals",
        ),
        q(
          "Area",
          "Area between curves",
          "Find the area of the region between y = x and y = x².",
          "1/6 area units",
          "1p intersections, 2p integral, 2p answer",
          "Apply integration to area",
        ),
      ],
    },
    electricity: {
      title: "Electricity & Circuits",
      objectives: ["Apply Ohm's law", "Analyse series and parallel circuits"],
      questions: [
        q(
          "Ohm's law",
          "Current",
          "A 12 Ω resistor is connected to 6.0 V. What current flows through it?",
          "I = U/R = 0.50 A",
          "1p formula, 1p answer with unit",
          "Apply Ohm's law",
        ),
        q(
          "Circuits",
          "Series circuits",
          "Resistors of 4.0 Ω and 6.0 Ω are connected in series to 5.0 V. Find the current.",
          "R = 10 Ω, I = 0.50 A",
          "1p total resistance, 2p current",
          "Analyse series and parallel circuits",
        ),
        q(
          "Circuits",
          "Parallel circuits",
          "Find the equivalent resistance of 6.0 Ω and 3.0 Ω connected in parallel.",
          "2.0 Ω",
          "2p setup, 1p answer",
          "Analyse series and parallel circuits",
        ),
        q(
          "Power",
          "Electric power",
          "What power does a lamp use when it draws 0.25 A at 12 V?",
          "P = UI = 3.0 W",
          "1p formula, 1p answer",
          "Apply Ohm's law",
        ),
        q(
          "Circuits",
          "Explaining circuits",
          "Explain why the other lamps in a parallel circuit stay equally bright when one lamp breaks.",
          "Each branch has the same voltage, so the current in the other branches doesn't change.",
          "2p voltage, 2p reasoning about current",
          "Analyse series and parallel circuits",
        ),
      ],
    },
    democracy: {
      title: "Democracy & Institutions",
      objectives: ["Explain democratic processes", "Compare political systems"],
      questions: [
        q(
          "The constitution",
          "Fundamental laws",
          "Which four fundamental laws does Sweden have?",
          "The Instrument of Government, the Act of Succession, the Freedom of the Press Act and the Fundamental Law on Freedom of Expression",
          "1p for two correct, 2p for all four",
          "Explain democratic processes",
        ),
        q(
          "Elections",
          "The electoral system",
          "How often are elections to the Riksdag held?",
          "Every four years",
          "2p correct answer",
          "Explain democratic processes",
        ),
        q(
          "Forms of democracy",
          "Direct and representative",
          "Explain the difference between direct and representative democracy. Give an example of each.",
          "Direct: citizens decide themselves, e.g. a referendum. Representative: elected representatives decide, e.g. the Riksdag.",
          "2p explanation, 2p examples",
          "Explain democratic processes",
        ),
        q(
          "Political systems",
          "Comparing systems",
          "Compare parliamentarism with a presidential system. Name one advantage of each.",
          "Parliamentarism: the government needs the parliament's confidence. Presidential: the president is elected separately for a fixed term.",
          "2p comparison, 2p advantages",
          "Compare political systems",
        ),
        q(
          "Democracy today",
          "Media and democracy",
          "Discuss how social media can both strengthen and weaken democracy.",
          "Strengthen: more people can take part and scrutinise power. Weaken: disinformation and polarisation.",
          "2p for each side, 2p for balanced reasoning",
          "Compare political systems",
        ),
      ],
    },
    waves: { title: "Waves & Optics", objectives: ["Describe wave behaviour"] },
    assignments: [
      "Derivative problem set",
      "Lab report — Ohm's law",
      "Essay — Swedish democracy",
      "Integral practice",
    ],
    events: {
      mathLesson: "Mathematics 3C — Derivatives review",
      physicsLab: "Physics 2 — Circuit lab",
      planning: "Planning",
      retake: "Retake — Mathematics 3C",
    },
  },
  sv: {
    classes: {
      math3c: { name: "Matematik 3c", subject: "Matematik" },
      phys2: { name: "Fysik 2", subject: "Fysik" },
      soc3: { name: "Samhällskunskap 3", subject: "Samhällskunskap" },
    },
    derivatives: {
      title: "Derivator — prov 1",
      objectives: [
        "Derivera potensfunktioner",
        "Använda kedjeregeln",
        "Använda produktregeln",
        "Analysera funktioner med derivata",
        "Beskriva förändring med derivata",
        "Lösa optimeringsproblem",
      ],
      equivalentAnswer: "Likvärdig lösning — se lärarens facit",
      questions: [
        q(
          "Derivator",
          "Grundläggande derivering",
          "Derivera f(x) = 3x² + 5x − 2.",
          "f'(x) = 6x + 5",
          "1 p per rätt term, 1 p för korrekt skrivsätt",
          "Derivera potensfunktioner",
        ),
        q(
          "Derivator",
          "Deriveringsregler",
          "Derivera f(x) = x⁵ − 4x³.",
          "f'(x) = 5x⁴ − 12x²",
          "Full poäng om båda termerna är rätt",
          "Derivera potensfunktioner",
        ),
        q(
          "Kedjeregeln",
          "Sammansatta funktioner",
          "Derivera f(x) = (2x + 1)⁴.",
          "f'(x) = 8(2x + 1)³",
          "2 p yttre derivata, 2 p inre derivata",
          "Använda kedjeregeln",
        ),
        q(
          "Produktregeln",
          "Produkter av funktioner",
          "Derivera f(x) = x²·sin(x).",
          "f'(x) = 2x·sin(x) + x²·cos(x)",
          "2 p per term",
          "Använda produktregeln",
        ),
        q(
          "Kvotregeln",
          "Rationella funktioner",
          "Derivera f(x) = (x + 1)/(x − 2).",
          "f'(x) = −3/(x − 2)²",
          "2 p uppställning, 2 p förenkling",
          "Använda kvotregeln",
        ),
        q(
          "Tangenter",
          "Tangentens ekvation",
          "Bestäm ekvationen för tangenten till f(x) = x² där x = 3.",
          "y = 6x − 9",
          "1 p derivata, 1 p punkt, 1 p ekvation",
          "Tolka derivatan grafiskt",
        ),
        q(
          "Extrempunkter",
          "Kritiska punkter",
          "Bestäm och karakterisera extrempunkterna till f(x) = x³ − 3x.",
          "Maximum i x = −1, minimum i x = 1",
          "2 p kritiska punkter, 2 p karakterisering",
          "Analysera funktioner med derivata",
        ),
        q(
          "Tillämpningar",
          "Förändringshastighet",
          "En ballongs volym är V(t) = 4t². Hur snabbt ökar volymen när t = 5 s?",
          "V'(5) = 40 volymenheter/s",
          "2 p derivata, 1 p beräkning",
          "Beskriva förändring med derivata",
        ),
        q(
          "Exponentialfunktioner",
          "Derivering av exponentialfunktioner",
          "Derivera f(x) = e^{3x}.",
          "f'(x) = 3e^{3x}",
          "2 p inre derivata, 1 p svar",
          "Derivera exponentialfunktioner",
        ),
        q(
          "Logaritmer",
          "Derivering av logaritmfunktioner",
          "Derivera f(x) = ln(x² + 1).",
          "f'(x) = 2x/(x² + 1)",
          "2 p kedjeregeln, 1 p förenkling",
          "Derivera logaritmfunktioner",
        ),
        q(
          "Kurvritning",
          "Växande och avtagande",
          "Bestäm för vilka x som f(x) = x³ − 6x² + 9x är växande.",
          "Växande för x < 1 och x > 3",
          "2 p teckenstudium, 2 p intervall",
          "Analysera funktioner med derivata",
        ),
        q(
          "Optimering",
          "Tillämpad optimering",
          "En rektangel har omkretsen 40 m. Bestäm den största möjliga arean.",
          "10 m × 10 m, arean 100 m²",
          "2 p modell, 1 p derivata, 1 p svar",
          "Lösa optimeringsproblem",
        ),
      ],
    },
    integrals: {
      title: "Integraler — prov 2",
      objectives: ["Beräkna bestämda integraler", "Beräkna areor med integraler"],
      questions: [
        q(
          "Bestämda integraler",
          "Polynom",
          "Beräkna ∫₀² (3x² + 1) dx.",
          "10",
          "1 p primitiv funktion, 1 p insättning, 1 p svar",
          "Beräkna bestämda integraler",
        ),
        q(
          "Primitiva funktioner",
          "Potensfunktioner",
          "Ange en primitiv funktion till f(x) = 4x³.",
          "F(x) = x⁴ + C",
          "2 p för korrekt primitiv funktion",
          "Beräkna bestämda integraler",
        ),
        q(
          "Area",
          "Area under en kurva",
          "Beräkna arean mellan kurvan y = x² och x-axeln för 0 ≤ x ≤ 3.",
          "9 areaenheter",
          "2 p integral, 2 p beräkning",
          "Beräkna areor med integraler",
        ),
        q(
          "Bestämda integraler",
          "Exponentialfunktioner",
          "Beräkna ∫₀¹ eˣ dx.",
          "e − 1 ≈ 1,72",
          "2 p primitiv funktion, 2 p svar",
          "Beräkna bestämda integraler",
        ),
        q(
          "Area",
          "Area mellan kurvor",
          "Beräkna arean av området mellan y = x och y = x².",
          "1/6 areaenheter",
          "1 p skärningspunkter, 2 p integral, 2 p svar",
          "Beräkna areor med integraler",
        ),
      ],
    },
    electricity: {
      title: "Elektricitet och kretsar",
      objectives: ["Tillämpa Ohms lag", "Analysera serie- och parallellkopplingar"],
      questions: [
        q(
          "Ohms lag",
          "Ström",
          "Ett motstånd på 12 Ω ansluts till 6,0 V. Hur stor ström går genom motståndet?",
          "I = U/R = 0,50 A",
          "1 p formel, 1 p svar med enhet",
          "Tillämpa Ohms lag",
        ),
        q(
          "Kretsar",
          "Seriekoppling",
          "Motstånd på 4,0 Ω och 6,0 Ω seriekopplas till 5,0 V. Beräkna strömmen.",
          "R = 10 Ω, I = 0,50 A",
          "1 p ersättningsresistans, 2 p ström",
          "Analysera serie- och parallellkopplingar",
        ),
        q(
          "Kretsar",
          "Parallellkoppling",
          "Beräkna ersättningsresistansen för 6,0 Ω och 3,0 Ω parallellkopplade.",
          "2,0 Ω",
          "2 p uppställning, 1 p svar",
          "Analysera serie- och parallellkopplingar",
        ),
        q(
          "Effekt",
          "Elektrisk effekt",
          "Hur stor effekt utvecklas i en lampa som drar 0,25 A vid 12 V?",
          "P = UI = 3,0 W",
          "1 p formel, 1 p svar",
          "Tillämpa Ohms lag",
        ),
        q(
          "Kretsar",
          "Förklara kretsar",
          "Förklara varför de andra lamporna i en parallellkoppling lyser lika starkt när en lampa går sönder.",
          "Varje gren har samma spänning, så strömmen i de andra grenarna ändras inte.",
          "2 p spänning, 2 p resonemang om strömmen",
          "Analysera serie- och parallellkopplingar",
        ),
      ],
    },
    democracy: {
      title: "Demokrati och institutioner",
      objectives: ["Förklara demokratiska processer", "Jämföra politiska system"],
      questions: [
        q(
          "Grundlagarna",
          "Sveriges grundlagar",
          "Vilka fyra grundlagar har Sverige?",
          "Regeringsformen, successionsordningen, tryckfrihetsförordningen och yttrandefrihetsgrundlagen",
          "1 p för två rätt, 2 p för alla fyra",
          "Förklara demokratiska processer",
        ),
        q(
          "Val",
          "Valsystemet",
          "Hur ofta hålls val till riksdagen?",
          "Vart fjärde år",
          "2 p för rätt svar",
          "Förklara demokratiska processer",
        ),
        q(
          "Demokratiformer",
          "Direkt och representativ demokrati",
          "Förklara skillnaden mellan direkt och representativ demokrati. Ge ett exempel på varje.",
          "Direkt: medborgarna beslutar själva, t.ex. i en folkomröstning. Representativ: valda företrädare beslutar, t.ex. riksdagen.",
          "2 p förklaring, 2 p exempel",
          "Förklara demokratiska processer",
        ),
        q(
          "Politiska system",
          "Jämföra system",
          "Jämför parlamentarism med presidentstyre. Nämn en fördel med varje system.",
          "Parlamentarism: regeringen behöver riksdagens förtroende. Presidentstyre: presidenten väljs separat för en fast mandatperiod.",
          "2 p jämförelse, 2 p fördelar",
          "Jämföra politiska system",
        ),
        q(
          "Demokratin idag",
          "Medier och demokrati",
          "Diskutera hur sociala medier både kan stärka och försvaga demokratin.",
          "Stärka: fler kan delta och granska makten. Försvaga: desinformation och polarisering.",
          "2 p för varje sida, 2 p för ett nyanserat resonemang",
          "Jämföra politiska system",
        ),
      ],
    },
    waves: { title: "Vågor och optik", objectives: ["Beskriva vågors egenskaper"] },
    assignments: [
      "Uppgiftssamling — derivator",
      "Labbrapport — Ohms lag",
      "Essä — svensk demokrati",
      "Övningar på integraler",
    ],
    events: {
      mathLesson: "Matematik 3c — repetition derivator",
      physicsLab: "Fysik 2 — labb med kretsar",
      planning: "Planering",
      retake: "Omprov — Matematik 3c",
    },
  },
};

/** An exam's questions: the shapes with the wording in one language. */
function questionsFor(
  shapes: QuestionShape[],
  wording: QuestionText[],
  idPrefix: string,
): Question[] {
  return shapes.map(([type, difficulty, points], i) => {
    const text = wording[i]!;
    return {
      id: `${idPrefix}${i + 1}`,
      number: i + 1,
      type,
      topic: text.topic,
      skill: text.skill,
      difficulty,
      points,
      prompt: text.prompt,
      expectedAnswer: text.answer,
      gradingCriteria: text.criteria,
      objective: text.objective,
    };
  });
}

const pointsOf = (questions: Question[]) => questions.reduce((sum, q) => sum + q.points, 0);

/** Everyone in the class took the exam except the absent; scores spread over the points. */
function attendanceFor(classId: string, absentIds: string[], totalPoints: number): Attendance[] {
  return students
    .filter((s) => s.classId === classId)
    .map((s, i) => {
      if (absentIds.includes(s.id)) return { studentId: s.id, status: "absent" as const };
      return {
        studentId: s.id,
        status: "completed" as const,
        score: Math.round(totalPoints * (0.45 + ((i * 7) % 20) / 40)),
        versionId: i % 2 === 0 ? "v-a" : "v-b",
      };
    });
}

const notMarkedYet = (classId: string): Attendance[] =>
  students
    .filter((s) => s.classId === classId)
    .map((s) => ({ studentId: s.id, status: "pending" as const }));

function buildExams(t: DemoTexts): Exam[] {
  const derivatives = questionsFor(derivativeShapes, t.derivatives.questions, "q");
  const integrals = questionsFor(integralShapes, t.integrals.questions, "qi");
  const electricity = questionsFor(electricityShapes, t.electricity.questions, "qe");
  const democracy = questionsFor(democracyShapes, t.democracy.questions, "qd");
  return [
    {
      id: "exam-derivatives-1",
      title: t.derivatives.title,
      subject: t.classes.math3c.subject,
      classId: "math3c",
      date: "2026-11-12",
      time: "08:30",
      durationMin: 90,
      room: "B214",
      totalPoints: pointsOf(derivatives),
      status: "needs-grading",
      objectives: t.derivatives.objectives,
      versions: [
        {
          id: "v-a",
          label: "Version A",
          origin: "original",
          createdAt: "2026-10-28",
          approved: true,
          questions: derivatives,
        },
        {
          id: "v-b",
          label: "Version B",
          origin: "ai-generated",
          createdAt: "2026-11-02",
          approved: true,
          equivalenceScore: 96,
          questions: derivatives.map((question) => ({
            ...question,
            id: `${question.id}-b`,
            prompt: question.prompt.replace(/\d+/g, (n) => String(Number(n) + 1)),
            expectedAnswer: t.derivatives.equivalentAnswer,
          })),
        },
      ],
      attendance: attendanceFor(
        "math3c",
        ["math3c-s1", "math3c-s2", "math3c-s3"],
        pointsOf(derivatives),
      ),
    },
    {
      id: "exam-integrals",
      title: t.integrals.title,
      subject: t.classes.math3c.subject,
      classId: "math3c",
      date: "2026-12-04",
      time: "10:15",
      durationMin: 90,
      room: "B214",
      totalPoints: pointsOf(integrals),
      status: "upcoming",
      objectives: t.integrals.objectives,
      versions: [
        {
          id: "vi-a",
          label: "Version A",
          origin: "original",
          createdAt: "2026-11-18",
          approved: true,
          questions: integrals,
        },
      ],
      attendance: notMarkedYet("math3c"),
    },
    {
      id: "exam-electricity",
      title: t.electricity.title,
      subject: t.classes.phys2.subject,
      classId: "phys2",
      date: "2026-11-27",
      time: "13:00",
      durationMin: 80,
      room: "C104",
      totalPoints: pointsOf(electricity),
      status: "upcoming",
      objectives: t.electricity.objectives,
      versions: [
        {
          id: "ve-a",
          label: "Version A",
          origin: "original",
          createdAt: "2026-11-10",
          approved: true,
          questions: electricity,
        },
      ],
      attendance: notMarkedYet("phys2"),
    },
    {
      id: "exam-democracy",
      title: t.democracy.title,
      subject: t.classes.soc3.subject,
      classId: "soc3",
      date: "2026-10-09",
      time: "09:00",
      durationMin: 100,
      room: "A331",
      totalPoints: pointsOf(democracy),
      status: "completed",
      objectives: t.democracy.objectives,
      versions: [
        {
          id: "vd-a",
          label: "Version A",
          origin: "original",
          createdAt: "2026-09-25",
          approved: true,
          questions: democracy,
        },
      ],
      attendance: attendanceFor("soc3", ["soc3-s4"], pointsOf(democracy)),
    },
    {
      id: "exam-waves-draft",
      title: t.waves.title,
      subject: t.classes.phys2.subject,
      classId: "phys2",
      date: "2027-01-15",
      time: "08:30",
      durationMin: 90,
      room: "C104",
      // Planned; a draft has no questions yet.
      totalPoints: 36,
      status: "draft",
      objectives: t.waves.objectives,
      versions: [],
      attendance: [],
    },
  ];
}

const retakes: Retake[] = [
  { id: "r1", examId: "exam-derivatives-1", studentId: "math3c-s1", status: "needs-scheduling" },
  { id: "r2", examId: "exam-derivatives-1", studentId: "math3c-s2", status: "needs-scheduling" },
  {
    id: "r3",
    examId: "exam-derivatives-1",
    studentId: "math3c-s3",
    status: "scheduled",
    date: "2026-11-24",
    time: "14:30",
    room: "B210",
    versionId: "v-b",
  },
  {
    id: "r4",
    examId: "exam-democracy",
    studentId: "soc3-s4",
    status: "scheduled",
    date: "2026-10-22",
    time: "15:00",
    room: "A331",
    versionId: "vd-a",
  },
];

function buildAssignments(t: DemoTexts): Assignment[] {
  const [problemSet, labReport, essay, practice] = t.assignments;
  return [
    {
      id: "a1",
      title: problemSet,
      subject: t.classes.math3c.subject,
      classId: "math3c",
      due: "2026-11-18",
      submitted: 22,
      total: 27,
      toGrade: 9,
    },
    {
      id: "a2",
      title: labReport,
      subject: t.classes.phys2.subject,
      classId: "phys2",
      due: "2026-11-20",
      submitted: 19,
      total: 26,
      toGrade: 6,
    },
    {
      id: "a3",
      title: essay,
      subject: t.classes.soc3.subject,
      classId: "soc3",
      due: "2026-11-14",
      submitted: 26,
      total: 28,
      toGrade: 3,
    },
    {
      id: "a4",
      title: practice,
      subject: t.classes.math3c.subject,
      classId: "math3c",
      due: "2026-12-01",
      submitted: 5,
      total: 27,
      toGrade: 0,
    },
  ];
}

function buildTodayEvents(t: DemoTexts): CalendarEvent[] {
  return [
    {
      id: "e1",
      date: "today",
      time: "08:30",
      title: t.events.mathLesson,
      classId: "math3c",
      room: "B214",
      kind: "lesson",
      students: 27,
    },
    {
      id: "e2",
      date: "today",
      time: "10:15",
      title: t.events.physicsLab,
      classId: "phys2",
      room: "C104",
      kind: "lesson",
      students: 26,
    },
    { id: "e3", date: "today", time: "13:00", title: t.events.planning, kind: "planning" },
    {
      id: "e4",
      date: "today",
      time: "14:30",
      title: t.events.retake,
      classId: "math3c",
      room: "B210",
      kind: "retake",
      students: 3,
    },
  ];
}

/** A fresh copy of the demo workspace in the given language, safe to edit. */
export function createDemoWorkspace(language: Language): Workspace {
  const t = texts[language];
  const classes: ClassGroup[] = classIds.map((id) => ({
    id,
    room: classRooms[id],
    ...t.classes[id],
  }));
  return structuredClone({
    classes,
    students,
    exams: buildExams(t),
    retakes,
    assignments: buildAssignments(t),
    events: buildTodayEvents(t),
  });
}
