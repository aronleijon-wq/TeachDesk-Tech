// The help center's articles, in Swedish and English. The Help page shows them, and the Ask AI
// assistant answers from them, so both always describe TeachDesk the same way. Plan details
// come from pricing.ts so they can't drift from the Plans page. The articles name buttons and
// pages exactly as they read in that language.
import { LEGAL } from "./legal";
import type { Language } from "./messages";
import { FREE_AI_PER_MONTH, FREE_CLASS_LIMIT, TRIAL_DAYS, formatPrice, plans } from "./pricing";

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

const pro = plans("en").find((p) => p.name === "Pro");
const price = (sek: number | null | undefined) => formatPrice(sek ?? null, "sv");

const english: HelpCategory[] = [
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
          "Click Create class. The students are added right away.",
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
          "Go to Exams → New exam and follow three short steps: basics, questions and review.",
        steps: [
          "Enter the title, class, date, time and room.",
          "Choose how to add the questions: write them yourself, import an existing exam (upload a PDF or photo, or paste the text), or reuse an earlier exam.",
          "Check the summary, add learning objectives if you like, and click Create exam.",
        ],
        details: [
          "Importing an existing exam is part of Pro. If you write the questions yourself, add them on the exam's Questions tab after creating it.",
          "To have AI write a new exam for you, use Generate exam with AI instead.",
        ],
      },
      {
        id: "import-exam",
        title: "Import an existing exam",
        summary:
          "Already have an exam as a PDF, a photo or text? In Exams → New exam, choose Import an existing exam. AI turns it into the same questions in TeachDesk, with points, answers and grading criteria.",
        details: [
          "Your wording is kept, and an answer key in the file is used for the answers. Check the questions before creating the exam; you can edit them afterwards.",
          "Once the exam is in TeachDesk you can grade it, reuse it and make a retake version of it. To get a new exam instead, use Generate exam with AI.",
          "Importing exams is part of Pro.",
        ],
      },
      {
        id: "generate-exam",
        title: "Generate an exam with AI",
        summary:
          "Go to Exams → Generate exam with AI. Describe the exam in your own words, add material to base it on, or both.",
        steps: [
          "Choose the class.",
          "Describe the exam, for example the topics, length and level. Or drop in an earlier exam, course material or a list (PDF, photo, CSV or text file).",
          "Click Generate exam. After about half a minute you see the questions: check them, choose the date and click Create exam.",
        ],
        details: [
          "With material, AI writes a new exam in the same style and level; it doesn't copy the questions.",
          "Generating exams is part of Pro. You can edit every question afterwards.",
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
        id: "print-exam",
        title: "Print an exam or save it as a PDF",
        summary:
          "Open the exam and click Print. Choose the version, and the student copy or the answer key, then click Print or save as PDF.",
        details: [
          "The student copy has lines for the name and class and room for every answer. The answer key shows each question's answer and grading criteria. Both are laid out for A4, in the language TeachDesk is set to.",
          "For a PDF, choose Save as PDF in the print dialog. The exam needs its questions first.",
        ],
      },
      {
        id: "delete-exam",
        title: "Delete an exam",
        summary:
          "On the Exams page, click the bin on the exam's card, or open the exam and click Delete exam. You're asked to confirm first.",
        details: [
          "Deleting an exam also deletes its questions, versions, results and retakes. This can't be undone.",
        ],
      },
      {
        id: "attendance",
        title: "Mark who was at the exam",
        summary:
          "Open the exam's Attendance tab and mark the students who were absent. Then click Mark the other … present, or Mark everyone present if nobody was away.",
        details: [
          "Students marked Absent go straight into the retake queue. You can also mark each student Present, Absent or Pending one by one.",
          "Marking a student Present later — for example after their retake — takes them out of the queue.",
        ],
      },
      {
        id: "schedule-retake",
        title: "Schedule a retake",
        summary:
          "Open the exam's Retakes tab and choose a date, time and room for each student who missed it.",
        details: [
          "When several students need a retake, book one slot for all of them at the top of the Retakes tab. Use Reschedule to move a single student.",
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
          "With Pro, AI can suggest the scores from the students' finished tests: see Grade tests with AI.",
        ],
      },
      {
        id: "grade-with-ai",
        title: "Grade tests with AI",
        summary:
          "Open the exam's Grading tab and drop in the students' finished tests, one file per student (a PDF, or a photo for one-page tests). AI suggests points for every question, with a reason.",
        steps: [
          "Scan or photograph each student's test. Phone scanning apps can make one PDF per student.",
          "Drop the files on the Grading tab. AI grades about three at a time, around half a minute each, and finds the student from the name on the paper. If it can't, you choose the student. Stay on the Grading tab until it's done.",
          "Under To review, check each student: open Review to see the answers, change points where you disagree, and click Approve. Only approved scores count.",
        ],
        details: [
          "Answers that are hard to read or ambiguous are marked Check. AI grades against each question's expected answer and grading criteria, so fill those in for the best suggestions.",
          "When several students have nothing marked Check, approve them all at once with Approve … with nothing to check. Points you've changed are kept.",
          "TeachDesk doesn't keep the uploaded files; they're only sent to be read. Grading with AI is part of Pro.",
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
          `Pro: ${price(pro?.price)} per month (or ${price(pro?.yearlyPrice)} per year) — unlimited classes and AI retakes, generating new exams with AI, and importing existing exams from PDFs and photos.`,
          "Enterprise: for whole schools and municipalities, with invoice billing. Contact us for a quote.",
          "To change plan, open the account menu (your initials, top right) and choose Plan.",
        ],
      },
      {
        id: "language",
        title: "Change the language",
        summary:
          "TeachDesk is in Swedish or English. Change it in Settings → Language, or choose På svenska in the account menu (your initials, top right).",
        details: [
          "On the sign-in page, use the link at the top right. The choice is saved on this device.",
          "Printed exams and AI's notes to you follow the language you choose.",
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
          "AI features only send what you choose, like an exam's questions or the tests you upload for grading, to our AI provider, and it isn't used to train AI models. TeachDesk doesn't keep uploaded tests.",
          "The privacy policy has the details.",
        ],
      },
    ],
  },
];

const swedish: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Kom igång",
    description: "Grunderna, din första klass och hur allt sparas.",
    articles: [
      {
        id: "what-is-teachdesk",
        title: "Vad är TeachDesk?",
        summary:
          "TeachDesk samlar prov, omprov, rättning och elevuppföljning på ett ställe. Det fungerar vid sidan av SchoolSoft, Vklass och Unikum i stället för att ersätta dem.",
        details: [
          "Översikten visar det som behöver din uppmärksamhet: omprov att boka, prov och uppgifter att rätta, och elever att följa upp.",
        ],
      },
      {
        id: "demo-data",
        title: "Exempeldata eller dina egna klasser",
        summary:
          "Nya konton börjar med exempeldata — exempelklasser och exempelelever att utforska. Stäng av det under Inställningar → Visa exempeldata för att arbeta med dina egna klasser.",
        details: [
          "Exempeldatan finns bara i den här webbläsaren. Inget tas bort när du byter mellan exempeldatan och dina egna klasser.",
          "Vill du börja om med exempeldatan väljer du Inställningar → Återställ exempeldata. Dina egna klasser påverkas inte.",
        ],
      },
      {
        id: "first-class",
        title: "Lägg till din första klass",
        summary: "Gå till Elever → Ny klass, ge klassen ett namn och klistra in elevlistan.",
        steps: [
          "Öppna Elever och klicka på Ny klass.",
          "Skriv klassens namn, och ämne och sal om du vill.",
          "Klistra in elevlistan, en elev per rad. Du kan kopiera den direkt från SchoolSoft, Excel eller Google Kalkylark.",
          "Klicka på Skapa klassen. Eleverna läggs till direkt.",
        ],
        details: [
          "Namn kan skrivas ”Förnamn Efternamn” eller ”Efternamn, Förnamn”, med en e-postadress på samma rad om du har en.",
          `Gratisplanen har plats för ${FREE_CLASS_LIMIT} klasser; Pro har ingen gräns.`,
        ],
      },
      {
        id: "saving",
        title: "Sparas mitt arbete?",
        summary:
          "Ja. Dina ändringar sparas automatiskt på ditt konto, så att de finns på alla enheter. Statusen bredvid sidans rubrik visar Sparat, Sparar… eller Inte sparat — försöker igen.",
        details: [
          "Utan internet fortsätter TeachDesk att försöka, och frågar innan du stänger fliken med osparade ändringar.",
          "Om en kollega eller en annan enhet ändrade samma sak i samma stund laddas den senaste versionen, och du ombeds kontrollera din senaste ändring.",
        ],
      },
    ],
  },
  {
    id: "exams",
    title: "Prov och omprov",
    description: "Skapa prov, markera närvaro och boka omprov.",
    articles: [
      {
        id: "create-exam",
        title: "Skapa ett prov",
        summary:
          "Gå till Prov → Nytt prov och följ tre korta steg: grunduppgifter, frågor och granskning.",
        steps: [
          "Fyll i provets namn, klass, datum, tid och sal.",
          "Välj hur frågorna ska läggas till: skriv dem själv, importera ett befintligt prov (ladda upp en PDF eller ett foto, eller klistra in texten), eller återanvänd ett tidigare prov.",
          "Kontrollera sammanfattningen, lägg till lärandemål om du vill och klicka på Skapa provet.",
        ],
        details: [
          "Att importera ett befintligt prov ingår i Pro. Skriver du frågorna själv lägger du till dem under provets flik Frågor när provet har skapats.",
          "Vill du att AI skriver ett nytt prov åt dig använder du Skapa prov med AI i stället.",
        ],
      },
      {
        id: "import-exam",
        title: "Importera ett befintligt prov",
        summary:
          "Har du redan ett prov som PDF, foto eller text? Välj Importera ett befintligt prov under Prov → Nytt prov. AI gör om det till samma frågor i TeachDesk, med poäng, svar och bedömningskriterier.",
        details: [
          "Dina formuleringar behålls, och finns det ett facit i filen används det för svaren. Kontrollera frågorna innan du skapar provet; du kan ändra dem efteråt.",
          "När provet finns i TeachDesk kan du rätta det, återanvända det och skapa en omprovsversion av det. Vill du i stället få ett nytt prov använder du Skapa prov med AI.",
          "Att importera prov ingår i Pro.",
        ],
      },
      {
        id: "generate-exam",
        title: "Skapa ett prov med AI",
        summary:
          "Gå till Prov → Skapa prov med AI. Beskriv provet med egna ord, lägg till material att utgå från, eller både och.",
        steps: [
          "Välj klass.",
          "Beskriv provet, till exempel områden, längd och nivå. Eller släpp in ett tidigare prov, kursmaterial eller en lista (PDF, foto, CSV- eller textfil).",
          "Klicka på Skapa prov. Efter ungefär en halv minut ser du frågorna: kontrollera dem, välj datum och klicka på Skapa provet.",
        ],
        details: [
          "Med material skriver AI ett nytt prov i samma stil och på samma nivå; frågorna kopieras inte.",
          "Att skapa prov med AI ingår i Pro. Du kan ändra alla frågor efteråt.",
        ],
      },
      {
        id: "write-questions",
        title: "Skriv eller ändra frågor",
        summary:
          "Öppna provets flik Frågor. Klicka på Lägg till fråga för att skriva en ny, eller på Redigera för att ändra en.",
        details: [
          "Nya frågor läggs till i Version A, originalet. Provets totalpoäng följer frågorna.",
        ],
      },
      {
        id: "print-exam",
        title: "Skriv ut ett prov eller spara det som PDF",
        summary:
          "Öppna provet och klicka på Skriv ut. Välj version och Elevens exemplar eller Facit, och klicka sedan på Skriv ut eller spara som PDF.",
        details: [
          "Elevens exemplar har rader för namn och klass och plats för varje svar. Facit visar varje frågas svar och bedömningskriterier. Båda är anpassade för A4 och skrivs på det språk TeachDesk är inställt på.",
          "För en PDF väljer du Spara som PDF i utskriftsdialogen. Provet behöver ha frågor först.",
        ],
      },
      {
        id: "delete-exam",
        title: "Ta bort ett prov",
        summary:
          "Klicka på papperskorgen på provets kort på sidan Prov, eller öppna provet och klicka på Ta bort provet. Du får bekräfta först.",
        details: [
          "När ett prov tas bort försvinner också dess frågor, versioner, resultat och omprov. Det går inte att ångra.",
        ],
      },
      {
        id: "attendance",
        title: "Markera vilka som skrev provet",
        summary:
          "Öppna provets flik Närvaro och markera eleverna som var frånvarande. Klicka sedan på Markera de övriga … som närvarande, eller på Markera alla som närvarande om ingen var borta.",
        details: [
          "Elever som markeras som Frånvarande hamnar direkt i omprovskön. Du kan också markera varje elev som Närvarande, Frånvarande eller Ej markerad, en i taget.",
          "Markerar du en elev som Närvarande senare — till exempel efter omprovet — försvinner eleven ur kön.",
        ],
      },
      {
        id: "schedule-retake",
        title: "Boka ett omprov",
        summary:
          "Öppna provets flik Omprov och välj datum, tid och sal för varje elev som missade provet.",
        details: [
          "När flera elever behöver omprov kan du boka samma tid för alla högst upp under fliken Omprov. Använd Boka om för att flytta en enskild elev.",
          "Bokade omprov syns i kalendern och i omprovskön på översikten.",
          "När eleven har skrivit omprovet markerar du eleven som Närvarande under fliken Närvaro och fyller i resultatet.",
        ],
      },
      {
        id: "equivalent-version",
        title: "Skapa en likvärdig omprovsversion med AI",
        summary:
          "Öppna provet och klicka på Skapa likvärdig version. AI skriver en ny version som prövar samma förmågor för samma poäng, med nya siffror och sammanhang.",
        details: [
          "Provet behöver ha frågor först. Du granskar varje fråga och godkänner versionen under fliken Versioner innan den används.",
          `Gratisplanen har ${FREE_AI_PER_MONTH} omprov skapade med AI per månad. Pro och skollicenser har ingen gräns.`,
        ],
      },
    ],
  },
  {
    id: "grading",
    title: "Rättning och resultat",
    description: "Fyll i resultat och se hur eleverna ligger till.",
    articles: [
      {
        id: "enter-results",
        title: "Fyll i provresultat",
        summary:
          "Öppna provets flik Rättning och fyll i varje elevs resultat. Eleverna visas där när de är markerade som Närvarande.",
        details: [
          "Att rätta på översikten räknar prov utan resultat när provdagen har passerat, plus inlämnade uppgifter som väntar på bedömning.",
          "Med Pro kan AI föreslå resultat utifrån elevernas färdiga prov: se Rätta prov med AI.",
        ],
      },
      {
        id: "grade-with-ai",
        title: "Rätta prov med AI",
        summary:
          "Öppna provets flik Rättning och släpp in elevernas färdiga prov, en fil per elev (en PDF, eller ett foto för prov på en sida). AI föreslår poäng för varje fråga, med en motivering.",
        steps: [
          "Skanna eller fotografera varje elevs prov. Skanningsappar i mobilen kan göra en PDF per elev.",
          "Släpp filerna under fliken Rättning. AI rättar ungefär tre prov åt gången, cirka en halv minut per prov, och hittar eleven via namnet på provet. Går det inte väljer du eleven själv. Stanna på fliken Rättning tills det är klart.",
          "Under Att granska kontrollerar du varje elev: öppna Granska för att se svaren, ändra poängen där du inte håller med och klicka på Godkänn. Bara godkända resultat räknas.",
        ],
        details: [
          "Svar som är svåra att läsa eller tvetydiga markeras med Kontrollera. AI rättar mot varje frågas förväntade svar och bedömningskriterier, så fyll i dem för bästa förslag.",
          "När flera elever inte har något markerat med Kontrollera kan du godkänna alla på en gång med Godkänn … utan anmärkningar. Poäng du har ändrat behålls.",
          "TeachDesk sparar inte de uppladdade filerna; de skickas bara för att läsas. Att rätta med AI ingår i Pro.",
        ],
      },
      {
        id: "gradebook",
        title: "Resultat, export och analys",
        summary:
          "Sidan Resultat visar varje elevs resultat per prov. Exportera CSV laddar ner dem som en fil för Excel eller Google Kalkylark.",
        details: [
          "Analys visar snittresultatet för varje prov och vilka elever som behöver följas upp. Snitt och närvaro räknas fram ur resultaten och närvaron du fyller i.",
        ],
      },
      {
        id: "assignments",
        title: "Uppgifter",
        summary:
          "Uppgifter kommer senare. Just nu hanterar TeachDesk prov, omprov, resultat och uppföljning; exempeldatan visar hur uppgifter kommer att se ut.",
      },
    ],
  },
  {
    id: "students",
    title: "Elever och uppföljning",
    description: "Håll koll på vem som behöver vad.",
    articles: [
      {
        id: "follow-up",
        title: "Vad ”Behöver omprov” och ”Att följa upp” betyder",
        summary: "På sidan Elever visar kolumnen Uppföljning vad varje elev har kvar att göra.",
        details: [
          "Behöver omprov: eleven missade ett prov och inget omprov är bokat än.",
          "Omprov med datum: ett omprov är bokat.",
          "Saknas: uppgifter som eleven inte har lämnat in.",
          "I fas: inget väntar.",
          "På översikten räknar Att följa upp alla elever med ett missat prov eller saknade uppgifter.",
        ],
      },
      {
        id: "remove-student",
        title: "Ta bort en elev eller klass",
        summary:
          "På sidan Elever klickar du på papperskorgen bredvid en elev, eller väljer en klass och klickar på Ta bort klassen.",
        details: [
          "När en elev tas bort försvinner också elevens provresultat och omprov. När en klass tas bort försvinner dess elever, prov, omprov och uppgifter. Det går inte att ångra.",
        ],
      },
    ],
  },
  {
    id: "schools",
    title: "Skolor och kollegor",
    description: "Gå med i din skola, dela klasser och bjud in kollegor.",
    articles: [
      {
        id: "join-school",
        title: "Gå med i din skola med en inbjudningslänk",
        summary:
          "Öppna länken du fick, logga in med e-postadressen som den skickades till och klicka på Gå med.",
        details: [
          "Bara den inbjudna adressen kan ta emot en inbjudan, så en vidarebefordrad länk fungerar inte för någon annan.",
          "Inbjudningslänkar gäller i 14 dagar. Har din gått ut ber du skolans administratör om en ny.",
        ],
      },
      {
        id: "switch-workspace",
        title: "Byt mellan din skola och dina egna klasser",
        summary:
          "Lärare på en skola har en meny för arbetsytor högst upp på sidan: välj din skola, Personlig eller Exempeldata.",
        details: ["Skolans arbetsyta delas med de andra lärarna på skolan. Personlig är bara din."],
      },
      {
        id: "invite-colleagues",
        title: "Bjud in kollegor (för skolans administratörer)",
        summary:
          "Öppna Skola i sidomenyn, skriv en kollegas e-postadress och klicka på Skapa inbjudningslänk. Kopiera länken och skicka den till kollegan.",
        details: [
          "Varje kollega får en egen länk. Länkarna gäller i 14 dagar, och du kan förnya eller dra tillbaka dem.",
          "Administratörer kan också se alla på skolan och ta bort lärare.",
        ],
      },
      {
        id: "pilot",
        title: "Skolpiloter",
        summary:
          "Under en pilot har alla på skolan alla Pro-verktyg gratis. Sidan Skola visar när piloten tar slut.",
        details: ["Vill ni fortsätta efter piloten kontaktar ni oss om en skollicens."],
      },
    ],
  },
  {
    id: "account",
    title: "Abonnemang och konto",
    description: "Abonnemang, din profil och integritet.",
    articles: [
      {
        id: "plans",
        title: "Abonnemang och priser",
        summary: `Alla nya konton får ${TRIAL_DAYS} dagar Pro gratis. Sedan har du gratisplanen kvar om du inte uppgraderar.`,
        details: [
          `Gratis: upp till ${FREE_CLASS_LIMIT} klasser och ${FREE_AI_PER_MONTH} omprov skapade med AI per månad.`,
          `Pro: ${price(pro?.price)} per månad (eller ${price(pro?.yearlyPrice)} per år) — obegränsat antal klasser och omprov med AI, nya prov skapade med AI, och import av befintliga prov från PDF och foton.`,
          "Skola: för hela skolor och kommuner, med betalning mot faktura. Kontakta oss för en offert.",
          "För att byta abonnemang öppnar du kontomenyn (dina initialer uppe till höger) och väljer Abonnemang.",
        ],
      },
      {
        id: "language",
        title: "Byt språk",
        summary:
          "TeachDesk finns på svenska och engelska. Byt under Inställningar → Språk, eller välj In English i kontomenyn (dina initialer uppe till höger).",
        details: [
          "På inloggningssidan byter du språk med länken uppe till höger. Valet sparas på den här enheten.",
          "Utskrivna prov och AI:s kommentarer till dig följer språket du har valt.",
        ],
      },
      {
        id: "profile",
        title: "Ändra namn, skola eller lösenord",
        summary: "Ditt namn, din roll och din skola finns under Inställningar.",
        details: [
          "För att byta lösenord loggar du ut och klickar på Glömt lösenordet? på inloggningssidan. Loggar du in med Google hanteras lösenordet av Google.",
        ],
      },
      {
        id: "privacy",
        title: "Integritet och dina elevers data",
        summary: "Bara du — och kollegorna i skolans arbetsyta — kan se dina klasser och elever.",
        details: [
          "AI-funktionerna skickar bara det du väljer, som ett provs frågor eller proven du laddar upp för rättning, till vår AI-leverantör, och det används inte för att träna AI-modeller. TeachDesk sparar inte uppladdade prov.",
          "Integritetspolicyn har alla detaljer.",
        ],
      },
    ],
  },
];

const categories: Record<Language, HelpCategory[]> = { en: english, sv: swedish };

/** The help center's categories and articles in the given language. */
export const helpCategories = (language: Language) => categories[language];

export const SUPPORT_EMAIL = LEGAL.contactEmail;

/** Articles matching a search, with the category each belongs to. */
export function searchHelp(query: string, language: Language) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return categories[language].flatMap((category) =>
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
export function helpArticlesAsText(language: Language) {
  return categories[language]
    .map((category) =>
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
    )
    .join("\n\n");
}
