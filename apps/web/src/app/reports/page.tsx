export default function ReportsExplainerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">Medical report explanation</h1>
      <p className="mt-3 text-ink-700">
        After a consultation ends, TELEMEDICINE AI can generate a structured summary and PDF report that separates
        patient-reported facts, AI interpretations, uncertainties, safety outcomes, and recommended next steps.
      </p>
      <p className="mt-3 text-ink-700">
        Reports are labeled AI-generated and are available from your dashboard and consultation detail page.
      </p>
    </div>
  );
}
