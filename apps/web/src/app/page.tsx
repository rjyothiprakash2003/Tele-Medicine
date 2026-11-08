import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(15,23,42,0.72), rgba(15,118,110,0.55)), url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 text-white">
          <p className="font-display text-5xl leading-none tracking-tight md:text-7xl">
            TELEMEDICINE AI
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-3xl leading-tight md:text-4xl">
            Healthcare Information, Powered by AI.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-teal-50/95">
            Explore your symptoms, ask health questions, and communicate with an AI assistant
            through voice, chat, and interactive video.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/consult/chat"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-teal-50"
            >
              Start AI Consultation
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore How It Works
            </Link>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-teal-100/90">
            The assistant is AI-generated — not a licensed physician. It does not provide guaranteed
            diagnoses, clinical certification claims, or legally valid prescriptions.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl text-ink-900">What the AI can and cannot do</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-brand-900/10 bg-white/80 p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-brand-800">Can help with</h3>
            <ul className="mt-3 space-y-2 text-ink-700">
              <li>Guided symptom questions and structured summaries</li>
              <li>Chat and AI avatar video conversations</li>
              <li>Citations from public health sources when available</li>
              <li>Consultation tokens, history, and downloadable reports</li>
              <li>Review of uploaded prior prescription images (educational)</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6">
            <h3 className="text-lg font-semibold text-rose-800">Cannot replace</h3>
            <ul className="mt-3 space-y-2 text-rose-900/80">
              <li>Emergency care — call 112 / 108 in India when needed</li>
              <li>Physical examination by a clinician</li>
              <li>Guaranteed diagnosis or treatment outcomes</li>
              <li>Legally valid prescriptions requiring a licensed prescriber</li>
              <li>Human doctor matching, ratings, or clinician workflows</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
