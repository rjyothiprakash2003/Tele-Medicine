import Link from 'next/link';

const steps = [
  {
    title: 'Start without an account',
    body: 'No login or email required. A private browser session creates your guest patient profile automatically.',
  },
  {
    title: 'Choose chat or AI video',
    body: 'Talk with a clearly labeled AI avatar (male or female presentation) or use text chat with optional voice input.',
  },
  {
    title: 'Guided assessment',
    body: 'The AI asks focused follow-up questions, checks emergency warning signs, and explains uncertainty.',
  },
  {
    title: 'Token, records, thank-you',
    body: 'Each consultation gets a token number. Upload prior Rx images, generate an AI medication record image, download reports, and receive a thank-you when finished.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="font-display text-4xl text-ink-900">How it works</h1>
      <p className="mt-3 text-lg text-ink-700">
        TELEMEDICINE AI is an information and consultation platform powered entirely by AI assistants.
        There is no human-doctor module.
      </p>
      <ol className="mt-10 space-y-6">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-3xl border border-brand-900/10 bg-white/80 p-6 shadow-soft">
            <p className="text-sm font-semibold text-brand-700">Step {i + 1}</p>
            <h2 className="mt-1 font-display text-2xl">{s.title}</h2>
            <p className="mt-2 text-ink-700">{s.body}</p>
          </li>
        ))}
      </ol>
      <Link
        href="/consult/chat"
        className="mt-10 inline-flex rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white"
      >
        Start AI Consultation
      </Link>
    </div>
  );
}
