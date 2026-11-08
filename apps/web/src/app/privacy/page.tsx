export default function PrivacyPage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-ink-900">Privacy policy</h1>
      <p>
        TELEMEDICINE AI processes health-related information you choose to share during consultations.
        Patient health data is classified as highly sensitive.
      </p>
      <h2>What we collect</h2>
      <p>
        Session identifiers, optional profile details, consultation messages, uploaded documents, safety events,
        and generated reports/medication records.
      </p>
      <h2>What we do not do by default</h2>
      <p>
        We do not require email login in this build, do not send Gmail/SMTP notifications, and do not use
        identifiable conversations to train third-party models unless separately configured with lawful basis and consent.
      </p>
      <h2>Your controls</h2>
      <p>
        You may review profile information in the app. Request deletion through your administrator subject to retention obligations.
      </p>
    </article>
  );
}
