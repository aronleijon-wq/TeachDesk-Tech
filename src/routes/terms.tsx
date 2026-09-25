import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactEmail, LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — TeachDesk" },
      { name: "description", content: "The terms for using TeachDesk." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of service">
      <section>
        <p>
          These terms apply when you use TeachDesk, provided by {LEGAL.company}. By creating an account or using the
          service you agree to them. Questions: <ContactEmail />.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          TeachDesk helps teachers manage exams, retakes, grading and follow-up, including AI-assisted equivalent exam
          versions. The service is under active development; features may change, and we may add, change or remove
          them.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must give accurate information and keep your sign-in details secure.</li>
          <li>You are responsible for what happens under your account.</li>
          <li>Tell us straight away if you think your account has been misused.</li>
        </ul>
      </section>

      <section>
        <h2>AI-generated content</h2>
        <p>
          AI suggestions and generated exam versions can contain mistakes. You are responsible for reviewing and
          approving all content before using it with students. TeachDesk never uses a generated version until a teacher
          has approved it.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep all rights to the exams and material you add. You give us permission to process that content only to
          provide the service to you. Do not upload content you are not allowed to use, or personal data about students
          beyond what the service needs.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not misuse the service — for example by trying to access other users' data, disrupting the service, or
          using it for anything unlawful.
        </p>
      </section>

      <section>
        <h2>Payment</h2>
        <p>
          Paid plans, prices and invoicing are agreed with you or your school before you are charged. We will tell you
          in advance about any price changes.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          We work hard to keep TeachDesk reliable, but the service is provided "as is". To the extent permitted by law,
          we are not liable for indirect losses, such as lost data or lost income. Nothing in these terms limits rights
          you have under mandatory consumer law.
        </p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>
          You can stop using TeachDesk at any time and ask us to delete your account. We may suspend accounts that break
          these terms.
        </p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          How we handle personal data is described in our <Link to="/privacy">privacy policy</Link>.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of {LEGAL.country}. Disputes are settled by Swedish courts.</p>
      </section>
    </LegalPage>
  );
}
