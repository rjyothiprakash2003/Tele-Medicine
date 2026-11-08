'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ChatConsultation } from './chat-consultation';
import { PrescriptionCard } from './prescription-card';

type VoiceSession = {
  sessionId: string;
  mock: boolean;
  disclosure: string;
  provider: string;
};

export function VideoConsultation() {
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [tokenNumber, setTokenNumber] = useState<string | null>(null);
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [state, setState] = useState('INITIALIZING');
  const [captions, setCaptions] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [rxId, setRxId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<
    Array<{
      name: string;
      strength: string;
      form: string;
      dosage: string;
      frequency: string;
      duration: string;
      purpose: string;
    }>
  >([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [session]);

  async function boot() {
    setError(null);
    setState('INITIALIZING');
    try {
      const c = await api<{ id: string; tokenNumber: string }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'VIDEO',
          avatarGender: gender,
          language: 'en',
          reason: 'AI video consultation',
        }),
      });
      setConsultationId(c.id);
      setTokenNumber(c.tokenNumber);
      const vs = await api<VoiceSession>('/voice-sessions', {
        method: 'POST',
        body: JSON.stringify({ consultationId: c.id, avatarGender: gender }),
      });
      setSession(vs);
      setState('READY');
      await speak(
        'Hello. I am your TELEMEDICINE AI assistant. I am an AI-generated avatar, not a licensed physician. How can I help today?',
      );
      setState('LISTENING');
    } catch (e) {
      setState('ERROR');
      setError(e instanceof Error ? e.message : 'Failed to start video session');
    }
  }

  async function speak(text: string) {
    setSpeaking(true);
    setState('SPEAKING');
    if ('speechSynthesis' in window) {
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          gender === 'MALE'
            ? voices.find((v) => /male|david|ravi/i.test(v.name))
            : voices.find((v) => /female|zira|samantha|veena/i.test(v.name));
        if (preferred) u.voice = preferred;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      });
    }
    setSpeaking(false);
    setState('LISTENING');
  }

  async function interrupt() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    if (session) {
      await api(`/voice-sessions/${session.sessionId}/interrupt`, { method: 'POST' });
    }
    setState('INTERRUPTED');
    setTimeout(() => setState('LISTENING'), 400);
  }

  async function toggleMic() {
    if (micOn) {
      recognitionRef.current?.stop();
      setMicOn(false);
      return;
    }
    const SR =
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition;
    if (!SR || !consultationId) {
      setError('Microphone speech recognition unavailable. Use chat fallback below.');
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';
    rec.onresult = async (ev: any) => {
      const text = ev.results?.[0]?.[0]?.transcript as string;
      if (!text) return;
      setState('PROCESSING');
      const result = await api<{
        emergency: boolean;
        message?: { content: string };
        guidance?: { guidance: string };
      }>(`/conversations/${consultationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      if (result.emergency) {
        setState('EMERGENCY');
        setError(result.guidance?.guidance ?? 'Seek emergency care now.');
        return;
      }
      await speak(result.message?.content ?? 'I am here to help.');
    };
    rec.onerror = () => {
      setMicOn(false);
      setState('ERROR');
    };
    recognitionRef.current = rec;
    rec.start();
    setMicOn(true);
    setState('LISTENING');
  }

  async function toggleCam() {
    if (camOn) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
    } catch {
      setError('Camera permission denied or unavailable.');
    }
  }

  async function endSession() {
    window.speechSynthesis?.cancel();
    if (session) await api(`/voice-sessions/${session.sessionId}/end`, { method: 'POST' });
    if (consultationId) {
      try {
        const rx = await api<{
          id: string;
          medicines?: Array<{
            name: string;
            strength: string;
            form: string;
            dosage: string;
            frequency: string;
            duration: string;
            purpose: string;
          }>;
        }>(`/prescriptions/consultation/${consultationId}/generate`, { method: 'POST' });
        setRxId(rx.id);
        setMedicines(rx.medicines ?? []);
      } catch {
        /* generation may fail if emergency */
      }
      await api(`/conversations/${consultationId}/end`, { method: 'POST' });
    }
    setState('COMPLETED');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-brand-900/10 bg-ink-900 p-4 text-white shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="text-teal-200">AI video consultation</p>
            {tokenNumber && <p className="font-mono text-lg">Token {tokenNumber}</p>}
          </div>
          <div className="text-right text-teal-100">
            <p>State: {state}</p>
            <p>
              {Math.floor(elapsed / 60)
                .toString()
                .padStart(2, '0')}
              :{(elapsed % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-teal-950">
          <div
            className={`absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal-700/80 text-4xl ${
              speaking ? 'avatar-speaking' : ''
            }`}
          >
            {gender === 'MALE' ? '♂' : '♀'}
          </div>
          <p className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs">
            AI-generated avatar · {session?.mock !== false ? 'Mock mode' : 'Live provider'}
          </p>
          {captions && (
            <p className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/55 px-3 py-2 text-sm">
              {state === 'SPEAKING'
                ? 'Avatar speaking…'
                : state === 'LISTENING'
                  ? 'Listening…'
                  : state === 'EMERGENCY'
                    ? 'Emergency flow active'
                    : 'Ready'}
            </p>
          )}
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute bottom-3 right-3 h-24 w-32 rounded-lg border border-white/30 object-cover"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!session ? (
            <>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                className="rounded-full bg-white/10 px-3 py-2 text-sm"
              >
                <option value="FEMALE">Female AI avatar</option>
                <option value="MALE">Male AI avatar</option>
              </select>
              <button
                type="button"
                onClick={boot}
                className="rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-ink-900"
              >
                Start AI video session
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={toggleMic} className="rounded-full bg-white/10 px-4 py-2 text-sm">
                Mic {micOn ? 'On' : 'Off'}
              </button>
              <button type="button" onClick={toggleCam} className="rounded-full bg-white/10 px-4 py-2 text-sm">
                Camera {camOn ? 'On' : 'Off'}
              </button>
              <button type="button" onClick={() => setCaptions((v) => !v)} className="rounded-full bg-white/10 px-4 py-2 text-sm">
                Captions
              </button>
              <button type="button" onClick={interrupt} className="rounded-full bg-amber-400/90 px-4 py-2 text-sm text-ink-900">
                Interrupt
              </button>
              <button type="button" onClick={endSession} className="rounded-full bg-rose-500 px-4 py-2 text-sm">
                End session
              </button>
            </>
          )}
        </div>
        {session && (
          <p className="mt-3 text-xs text-teal-100/90">{session.disclosure}</p>
        )}
        {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
        {state === 'COMPLETED' && (
          <p className="mt-3 rounded-xl bg-teal-500/20 p-3 text-sm">
            Thank you for consulting TELEMEDICINE AI. Your session token is {tokenNumber}. The avatar is AI-generated and not a licensed physician.
          </p>
        )}
        <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wide text-rose-200">
          AI Generated — Not a legally valid prescription
        </p>
      </div>

      <div className="space-y-4">
        {(medicines.length > 0 || rxId) && (
          <PrescriptionCard
            tokenNumber={tokenNumber ?? undefined}
            prescriptionId={rxId ?? undefined}
            medicines={medicines}
          />
        )}
        <p className="text-sm text-ink-700">
          Accessible chat fallback if avatar audio is unavailable:
        </p>
        <ChatConsultation mode="CHAT" />
      </div>
    </div>
  );
}
