import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-900/10 bg-ink-900 text-ink-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-xl text-white">TELEMEDICINE AI</p>
          <p className="mt-2 text-sm text-slate-300">
            Healthcare information powered by AI. Not a licensed physician. Not emergency care.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Product</p>
          <ul className="space-y-1 text-slate-300">
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/consult/video">AI video consultation</Link></li>
            <li><Link href="/consult/chat">AI health chat</Link></li>
            <li><Link href="/assessment">Symptom assessment</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Legal</p>
          <ul className="space-y-1 text-slate-300">
            <li><Link href="/privacy">Privacy policy</Link></li>
            <li><Link href="/terms">Terms of service</Link></li>
            <li><Link href="/disclaimer">AI medical disclaimer</Link></li>
            <li><Link href="/security">Privacy &amp; security</Link></li>
            <li><Link href="/contact">Contact &amp; support</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
        Emergency in India: call 112 / ambulance 108. AI-generated medication images are not legally valid prescriptions.
      </div>
    </footer>
  );
}
