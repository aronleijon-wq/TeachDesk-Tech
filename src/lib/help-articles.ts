// The help center's articles. The Help page shows them, and the Ask AI assistant answers
// from them, so both always describe TeachDesk the same way. Plan details come from
// pricing.ts so they can't drift from the Plans page.
import { LEGAL } from "./legal";
import { FREE_AI_PER_MONTH, FREE_CLASS_LIMIT, PLANS, TRIAL_DAYS, formatPrice } from "./pricing";

export interface HelpArticle {
  id: string;
  title: string;
  /** The short answer, shown first. */
  summary: string;
  /** Numbered steps, for how-to articles. */
  steps?: string[];
  /** More detail, one paragraph each. */
  details?: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  articles: HelpArticle[];
}

const pro = PLANS.find((p) => p.name === "Pro");
const proPrice = pro?.price ? `${formatPrice(pro.price)} per month` : "a monthly price";
const proYearly = pro?.yearlyPrice ? ` (or ${formatPrice(pro.yearlyPrice)} per year)` : "";

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "The basics, your first class and how saving works.",
    articles: [
      {
        id: "what-is-teachdesk",
        title: "What is TeachDesk?",
        summary:
          "TeachDesk gathers exams, retakes, grading and student follow-up in one place. It works alongside SchoolSoft, Vklass and Unikum rather than replacing them.",
        details: [
          "The dashboard shows what needs your attention: retakes to schedule, exam papers and assignments to grade, and students with missing work.",
        ],
      },
      {
        id: "demo-data",
        title: "Demo data or your own classes",
        summary:
          "New accounts start with demo data — example classes and students to explore. Turn it off in Settings → Show demo data to work with your own classes.",
        details: [
          "The demo is kept in this browser only. Switching between the demo and your own classes never deletes anything.",
          "To start the demo over, use Settings → Reset demo data. Your own classes aren't touched.",
        ],
      },
      {
        id: "first-class",
        title: "Add your first class",
        summary: "Go to Students → New class, name the class and paste in your student list.",
        steps: [
          "Open Students and click New class.",
          "Enter the class name, and the subject and room if you like.",
          "Paste the student list, one student per line. You can copy it straight from SchoolSoft, Excel or Google Sheets.",
          "Click Create. The students are added right away.",
        ],
        details: [
          "Names can be written “First Last” or “Last, First”, with an email address on the same line if you have one.",
          `The free plan includes ${FREE_CLASS_LIMIT} classes; Pro has no limit.`,
        ],
      },
      {
        id: "saving",
        title: "Is my work saved?",
        summary:
          "Yes. Your changes are saved to your account automatically, so they're there on any device. The status next to the page title shows Saved, Saving… or Not saved — retrying.",
        details: [
          "Without internet, TeachDesk keeps trying and asks before you close the tab with unsaved changes.",
          "If a colleague or another device changed the same thing at the same moment, the latest version is loaded and you're asked to check your last change.",
        ],
      },
    ],
  },
  {
    id: "exams",
    title: "Exams & retakes",
    description: "Create exams, mark attendance and book retakes.",
    articles: [
      {
        id: "create-exam",
        title: "Create an exam",
        summary:
          "Go to Exams → New exam and follow four short steps: basics, questions, details and review.",
        steps: [
          "Enter the title, class, date, time and room.",
          "Choose how to add the questions: write them yourself, use an existing exam (paste it, or upload a PDF or photo), generate them with AI, or reuse an earlier exam.",
          "Add learning objectives, check the summary and click Create exam.",
        ],
        details: [
          "Reading an existing exam and generating a new one with AI are part of Pro.",
          "If you write the questions yourself, add them on the exam's Questions tab after creating it.",
        ],
      },
      {
        id: "write-questions",
        title: "Write or change questions",
        summary:
          "Open the exam's Questions tab. Click Add question to write a new one, or Edit to change one.",
        details: [
          "New questions are added to Version A, the original. The exam's total points follow its questions.",
        ],
      },
      {
        id: "attendance",
        title: "Mark who was at the exam",
        summary:
          "Open the exam and use the Attendance tab to mark each student Present, Absent or Pending.",
        details: [
          "Students marked Absent go straight into the retake queue.",
          "Marking a student Present later — for example after their retake — takes them out of the queue.",
        ],
      },
      {
        id: "schedule-retake",
        title: "Schedule a retake",
        summary:
          "Open the exam's Retakes tab and choose a date, time and room for each student who missed it.",
        details: [
          "Booked retakes show in the calendar and in the dashboard's retake queue.",
          "When the student has taken the retake, mark them Present on the Attendance tab and enter their score.",
        ],
      },
      {
        id: "equivalent-version",
        title: "Make an equivalent retake version with AI",
        summary:
          "Open the exam and click Generate equivalent version. AI writes a new version that tests the same skills for the same points, with new numbers and contexts.",
        details: [
          "The exam needs its questions first. You review every question and approve the version on the Versions tab before it's used.",
          `The free plan includes ${FREE_AI_PER_MONTH} AI-generated retakes per month. Pro and school plans have no limit.`,
        ],
      },
    ],
  },
  {
    id: "grading",
    title: "Grading & results",
    description: "Enter results and see how students are doing.",
    articles: [
      {
        id: "enter-results",
        title: "Enter exam results",
        summary:
          "Open the exam's Grading tab and enter each student's score. Students appear there once they're marked Present.",
        details: [
          "The dashboard's To grade counts exam papers without a score once the exam day has passed, plus assignment submissions waiting to be graded.",
        ],
      },
      {
        id: "gradebook",
        title: "Gradebook, export and analytics",
        summary:
          "The Gradebook shows every student's result per exam. Export CSV downloads it as a file for Excel or Google Sheets.",
        details: [
          "Analytics shows the average result of each exam and which students need follow-up. Averages and attendance are worked out from the scores and attendance you enter.",
        ],
      },
      {
        id: "assignments",
        title: "Assignments",
        summary:
          "Assignments are coming later. For now TeachDesk handles exams, retakes, results and follow-up; the demo shows how assignments will look.",
      },
    ],
  },
  {
    id: "students",
    title: "Students & follow-up",
    description: "Keep track of who needs what.",
    articles: [
      {
        id: "follow-up",
        title: "What “Needs a retake” and “Missing work” mean",
        summary:
          "On the Students page, the Follow-up column shows what each student still has to do.",
        details: [
          "Needs a retake: the student missed an exam and no retake is booked yet.",
          "Retake with a date: a retake is booked.",
          "Missing: assignments the student hasn't handed in.",
          "Up to date: nothing is waiting.",
          "On the dashboard, Missing work counts every student with a missed exam or missing assignments.",
        ],
      },
      {
        id: "remove-student",
        title: "Remove a student or class",
        summary:
          "On the Students page, click the bin next to a student, or choose a class and click Delete class.",
        details: [
          "Removing a student also removes their exam results and retakes. Deleting a class removes its students, exams, retakes and assignments. This can't be undone.",
        ],
      },
    ],
  },
  {
    id: "schools",
    title: "Schools & colleagues",
    description: "Join your school, share classes and invite colleagues.",
    articles: [
      {
        id: "join-school",
        title: "Join your school with an invite link",
        summary:
          "Open the link you were sent, sign in with the email address it was sent to, and click Join.",
        details: [
          "Only the invited address can accept an invitation, so a forwarded link doesn't work for anyone else.",
          "Invite links last 14 days. If yours has expired, ask your school's admin for a new one.",
        ],
      },
      {
        id: "switch-workspace",
        title: "Switch between your school and your own classes",
        summary:
          "Teachers in a school have a workspace menu at the top of the page: choose your school, Personal or Demo data.",
        details: [
          "Your school's workspace is shared with the other teachers at the school. Personal is only yours.",
        ],
      },
      {
        id: "invite-colleagues",
        title: "Invite colleagues (school admins)",
        summary:
          "Open School in the sidebar, enter a colleague's email address and click Create invite link. Copy the link and send it to them.",
        details: [
          "Each colleague gets their own link. Links last 14 days, and you can renew or withdraw them.",
          "Admins can also see everyone in the school and remove teachers.",
        ],
      },
      {
        id: "pilot",
        title: "School pilots",
        summary:
          "During a pilot, everyone at the school has every Pro tool for free. The School page shows when the pilot ends.",
        details: ["To continue after the pilot, contact us about the Enterprise plan."],
      },
    ],
  },
  {
    id: "account",
    title: "Plans & account",
    description: "Plans, your profile and privacy.",
    articles: [
      {
        id: "plans",
        title: "Plans and prices",
        summary: `Every new account gets ${TRIAL_DAYS} days of Pro for free. Afterwards you keep the free plan unless you upgrade.`,
        details: [
          `Free: up to ${FREE_CLASS_LIMIT} classes and ${FREE_AI_PER_MONTH} AI-generated retakes per month.`,
          `Pro: ${proPrice}${proYearly} — unlimited classes and AI retakes, generating new exams with AI, and reading existing exams from PDFs and photos.`,
          "Enterprise: for whole schools and municipalities, with invoice billing. Contact us for a quote.",
          "To change plan, open the account menu (your initials, top right) and choose Plan.",
        ],
      },
      {
        id: "profile",
        title: "Change your name, school or password",
        summary: "Your name, role and school are in Settings.",
        details: [
          "To change your password, sign out and click Forgot password? on the sign-in page. If you sign in with Google, your password is managed by Google.",
        ],
      },
      {
        id: "privacy",
        title: "Privacy and your students' data",
        summary:
          "Only you — and the colleagues in your school's workspace — can see your classes and students.",
        details: [
          "AI features only send what you choose, like an exam's questions, to our AI provider, and it isn't used to train AI models.",
          "The privacy policy has the details.",
        ],
      },
    ],
  },
];

export const SUPPORT_EMAIL = LEGAL.contactEmail;

/** Articles matching a search, with the category each belongs to. */
export function searchHelp(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return HELP_CATEGORIES.flatMap((category) =>
    category.articles
      .filter((article) => {
        const text = [
          article.title,
          article.summary,
          ...(article.steps ?? []),
          ...(article.details ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return words.every((word) => text.includes(word));
      })
      .map((article) => ({ category, article })),
  );
}

/** All articles as plain text, for the Ask AI assistant. */
export function helpArticlesAsText() {
  return HELP_CATEGORIES.map((category) =>
    [
      `## ${category.title}`,
      ...category.articles.map((article) =>
        [
          `### ${article.title}`,
          article.summary,
          ...(article.steps ?? []).map((step, i) => `${i + 1}. ${step}`),
          ...(article.details ?? []),
        ].join("\n"),
      ),
    ].join("\n\n"),
  ).join("\n\n");
}
