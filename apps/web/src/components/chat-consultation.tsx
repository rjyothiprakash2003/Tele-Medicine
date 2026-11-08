'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, apiUrl } from '@/lib/api';
import { MedicineItem, PrescriptionCard } from './prescription-card';

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
};

type Consultation = {
  id: string;
  tokenNumber: string;
  status: string;
  messages: Message[];
  thankYouShown?: boolean;
  summary?: { summaryText: string } | null;
  prescriptions?: Array<{ id: string; structuredContent?: { medicines?: MedicineItem[] } }>;
  treatments?: Array<{ id: string; title: string; content: string }>;
};

type RxResult = {
  id: string;
  medicines?: MedicineItem[];
  structuredContent?: { medicines?: MedicineItem[] };
};

export function ChatConsultation({ mode = 'CHAT' }: { mode?: 'CHAT' | 'ASSESSMENT' }) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState<string | null>(null);
  const [thankYou, setThankYou] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [rxId, setRxId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consultation?.messages, thankYou, medicines]);

  async function start() {
    setBusy(true);
    setError(null);
    setThankYou(null);
    setRxId(null);
    setMedicines([]);
    setUploadNote(null);
    try {
      const c = await api<Consultation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          language: 'en',
          reason: mode === 'ASSESSMENT' ? 'Guided symptom assessment' : 'AI health chat',
        }),
      });
      setConsultation(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start');
    } finally {
      setBusy(false);
    }
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!consultation || !input.trim() || busy) return;
    const content = input.trim();
    setInput('');
    setBusy(true);
    setError(null);
    setConsultation((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              { id: `local-${Date.now()}`, role: 'USER', content },
            ],
          }
        : prev,
    );
    try {
      const result = await api<{
        emergency: boolean;
        message?: Message;
        guidance?: { guidance: string };
      }>(`/conversations/${consultation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (result.emergency) {
        setEmergency(result.guidance?.guidance ?? 'Seek emergency care');
        const refreshed = await api<Consultation>(`/conversations/${consultation.id}`);
        setConsultation(refreshed);
      } else {
        const refreshed = await api<Consultation>(`/conversations/${consultation.id}`);
        setConsultation(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  }

  async function endConsultation() {
    if (!consultation) return;
    setBusy(true);
    setError(null);
    try {
      const rx = await api<RxResult>(`/prescriptions/consultation/${consultation.id}/generate`, {
        method: 'POST',
      });
      const meds = rx.medicines ?? rx.structuredContent?.medicines ?? [];
      setRxId(rx.id);
      setMedicines(meds);

      try {
        await api(`/reports/consultation/${consultation.id}`, { method: 'POST' });
      } catch {
        // report optional
      }

      const ended = await api<Consultation>(`/conversations/${consultation.id}/end`, {
        method: 'POST',
      });
      setConsultation(ended);
      setThankYou(
        `Thank you for consulting TELEMEDICINE AI. Your token is ${ended.tokenNumber}. Your AI-generated medicines list and prescription image are ready below.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not end consultation');
    } finally {
      setBusy(false);
    }
  }

  function toggleVoice() {
    const SR =
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
        .webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition;
    if (!SR) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const text = ev.results[0]?.[0]?.transcript ?? '';
      setInput((v) => (v ? `${v} ${text}` : text));
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function uploadPriorRx(file: File) {
    if (!consultation) return;
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true);
    setUploadNote(null);
    try {
      const res = await fetch(
        apiUrl(`/medical-documents/upload?type=PRIOR_PRESCRIPTION&consultationId=${consultation.id}`),
        { method: 'POST', body: fd, credentials: 'include' },
      );
      if (!res.ok) throw new Error('Upload failed');
      setUploadNote(`Uploaded prior prescription: ${file.name}`);
    } catch {
      setError('Upload failed');
    } finally {
      setBusy(false);
    }
  }

  if (!consultation) {
    return (
      <div className="rounded-3xl border border-brand-900/10 bg-white/85 p-8 shadow-soft">
        <h2 className="font-display text-2xl">
          {mode === 'ASSESSMENT' ? 'Guided symptom assessment' : 'AI health chat'}
        </h2>
        <p className="mt-2 text-ink-700">
          No sign-in required. Your consultation will receive a unique token number.
          After you finish, an AI medicines list and prescription image will be generated.
        </p>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={start}
          className="mt-6 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Starting…' : 'Begin consultation'}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-900/10 bg-white/90 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-700">Consultation token</p>
          <p className="font-mono text-lg font-semibold text-ink-900">{consultation.tokenNumber}</p>
        </div>
        <p className="text-sm text-ink-700">Status: {consultation.status}</p>
      </div>

      {emergency && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900" role="alert">
          <p className="font-semibold">Emergency warning</p>
          <p className="mt-1 text-sm">{emergency}</p>
        </div>
      )}

      <div className="h-[46vh] overflow-y-auto rounded-3xl border border-brand-900/10 bg-white/90 p-4 shadow-soft">
        {consultation.messages.map((m) => (
          <div
            key={m.id}
            className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'USER'
                ? 'ml-auto bg-brand-700 text-white'
                : m.role === 'SAFETY'
                  ? 'bg-rose-100 text-rose-900'
                  : 'bg-ink-100 text-ink-900'
            }`}
          >
            <p className="mb-1 text-[10px] uppercase opacity-70">{m.role}</p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {thankYou && (
        <div className="rounded-2xl border border-brand-300 bg-brand-50 p-4 text-brand-900">
          <p className="font-semibold">Thank you</p>
          <p className="mt-1 text-sm">{thankYou}</p>
          <Link
            href={`/consultations/${consultation.id}`}
            className="mt-2 inline-block text-sm font-semibold underline"
          >
            Open full consultation record
          </Link>
        </div>
      )}

      {(medicines.length > 0 || rxId) && (
        <PrescriptionCard
          tokenNumber={consultation.tokenNumber}
          prescriptionId={rxId ?? undefined}
          medicines={medicines}
        />
      )}

      {consultation.status === 'ACTIVE' && (
        <>
          <form onSubmit={send} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your concern (e.g. fever, sore throat, cough)…"
              className="flex-1 rounded-2xl border border-brand-900/15 bg-white px-4 py-3 text-sm outline-none ring-brand-600 focus:ring-2"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className="rounded-2xl border border-brand-900/15 px-4 py-3 text-sm"
            >
              {listening ? 'Listening…' : 'Voice'}
            </button>
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-full border border-brand-900/15 px-4 py-2 text-sm">
              Upload prior prescription image
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPriorRx(f);
                }}
              />
            </label>
            <button
              type="button"
              onClick={endConsultation}
              disabled={busy}
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {busy ? 'Generating medicines…' : 'End consultation & get AI prescription'}
            </button>
          </div>
          {uploadNote && <p className="text-sm text-brand-800">{uploadNote}</p>}
        </>
      )}
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-rose-700">
        AI Generated content — Not a legally valid prescription
      </p>
    </div>
  );
}

type SpeechRecognition = {
  lang: string;
  start: () => void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
