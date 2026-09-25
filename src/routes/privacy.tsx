import { createFileRoute } from "@tanstack/react-router";
import { ContactEmail, LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — TeachDesk" },
      { name: "description", content: "How TeachDesk collects, uses and protects personal data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <section>
        <p>
          This policy explains what personal data {LEGAL.company} ("we") collects when you use our website and the
          TeachDesk app, why we collect it, and your rights. We follow the EU General Data Protection Regulation (GDPR).
          If you have questions, contact us at <ContactEmail />.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details</strong> — your name and email address when you create an account, either with a
            password or with Google sign-in. With Google we receive only your name, email address and profile picture.
          </li>
          <li>
            <strong>Demo requests</strong> — the name, email, organisation, role and message you enter in the "Book a
            demo" form.
          </li>
          <li>
            <strong>Exam content</strong> — exam questions you paste or upload so TeachDesk can read them and create
            equivalent versions.
          </li>
          <li>
            <strong>Technical data</strong> — error reports when something breaks, so we can fix it.
          </li>
        </ul>
      </section>

      <section>
        <h2>Google user data</h2>
        <p>
          If you choose "Continue with Google", we receive your name, email address and profile picture from your
          Google account. We use them only to create your TeachDesk account, sign you in and show your name in the app.
          We do not access your Gmail, Google Drive, Calendar or any other Google data. We do not sell Google user data,
          share it with third parties other than the service providers listed below, or use it for advertising. You can
          remove TeachDesk's access at any time in your Google account settings.
        </p>
        <p className="mt-2">
          TeachDesk's use of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2>Where your work is stored</h2>
        <p>
          Exams, versions, attendance, retakes and your profile settings are currently saved in your own browser on the
          device you use, not on our servers. Clearing your browser data removes them.
        </p>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To provide the service and let you sign in (performance of a contract).</li>
          <li>To reply to demo requests and support questions (legitimate interest).</li>
          <li>To keep the service secure and fix errors (legitimate interest).</li>
        </ul>
        <p className="mt-2">We do not sell personal data and we do not use it for advertising.</p>
      </section>

      <section>
        <h2>AI processing</h2>
        <p>
          When you ask TeachDesk to read an exam or generate an equivalent version, the exam text is sent to our AI
          provider, Anthropic, to produce the result. Anthropic does not use this data to train its models. Only exam
          content is sent — please do not include students' names or other personal data in exams you upload. Every
          AI-generated version must be reviewed and approved by a teacher before it is used.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>We use these providers to run TeachDesk. They process data only on our instructions:</p>
        <ul>
          <li>Lovable and Supabase — website hosting, sign-in and database.</li>
          <li>Anthropic — AI processing of exam content.</li>
          <li>Google — optional sign-in with a Google account.</li>
        </ul>
        <p className="mt-2">
          Some providers are based outside the EU/EEA, including in the USA. Where data is transferred there, it is
          protected by the EU Standard Contractual Clauses or an equivalent safeguard.
        </p>
      </section>

      <section>
        <h2>How long we keep data</h2>
        <p>
          We keep account details for as long as you have an account, and demo requests for up to 24 months after our
          last contact. You can ask us to delete your data at any time.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          We use your browser's local storage to keep you signed in and to save your work. We do not use advertising or
          tracking cookies.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can ask to access, correct, delete or export your personal data, or object to how we use it. Email{" "}
          <ContactEmail />. You also have the right to complain to the Swedish Authority for Privacy Protection
          (Integritetsskyddsmyndigheten, <a href="https://www.imy.se">imy.se</a>).
        </p>
      </section>

      <section>
        <h2>Schools</h2>
        <p>
          When a school uses TeachDesk for its staff and students, the school is the data controller and we act as its
          data processor. We sign a data processing agreement (personuppgiftsbiträdesavtal) with schools on request.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy, we will update the date at the top of this page.</p>
      </section>
    </LegalPage>
  );
}
