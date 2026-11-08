export default function SecurityPage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-ink-900">Privacy & security</h1>
      <p>
        The platform uses session cookies, input validation, access checks on patient-owned records, private document
        storage, and audit logging for administrative actions.
      </p>
      <p>
        Running on AWS-eligible services does not by itself establish HIPAA, GDPR, or India DPDP compliance.
        Conduct a full legal and security assessment before production claims.
      </p>
    </article>
  );
}
