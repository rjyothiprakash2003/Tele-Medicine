const faqs = [
  {
    q: 'Do I need to register or sign in?',
    a: 'No. TELEMEDICINE AI uses a private browser session so you can start chatting or speaking with the AI immediately.',
  },
  {
    q: 'Is the video character a real doctor?',
    a: 'No. It is an AI-generated avatar. The platform has no human-doctor module.',
  },
  {
    q: 'Are AI medication images valid prescriptions?',
    a: 'No. They are educational consultation records only. Where law requires a licensed prescriber, obtain care outside this platform.',
  },
  {
    q: 'What is a consultation token?',
    a: 'Each consultation receives a sequential token like TM-20261108-00042 so you can find it later on your dashboard.',
  },
  {
    q: 'What should I do in an emergency?',
    a: 'Call local emergency services immediately (India: 112 / ambulance 108). Do not wait for an AI assessment.',
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">Frequently asked questions</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((f) => (
          <details key={f.q} className="rounded-2xl border border-brand-900/10 bg-white/85 p-4">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm text-ink-700">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
