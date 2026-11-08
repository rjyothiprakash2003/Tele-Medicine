'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const [form, setForm] = useState({
    displayName: '',
    preferredLanguage: 'en',
    country: 'India',
    region: '',
    allergies: '',
    conditions: '',
    medications: '',
    consentAiDisclosure: true,
    consentTerms: true,
    consentPrivacy: true,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<any>('/patients/me').then((p) => {
      setForm({
        displayName: p.displayName ?? '',
        preferredLanguage: p.preferredLanguage ?? 'en',
        country: p.country ?? 'India',
        region: p.region ?? '',
        allergies: (p.medicalProfile?.allergies ?? []).map((a: any) => a.name).join(', '),
        conditions: (p.medicalProfile?.conditions ?? []).map((c: any) => c.name).join(', '),
        medications: (p.medicalProfile?.medications ?? []).map((m: any) => m.name).join(', '),
        consentAiDisclosure: p.consentAiDisclosure,
        consentTerms: p.consentTerms,
        consentPrivacy: p.consentPrivacy,
      });
    }).catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/patients/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: form.displayName || 'Guest Patient',
          preferredLanguage: form.preferredLanguage,
          country: form.country,
          region: form.region,
          allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
          conditions: form.conditions.split(',').map((s) => s.trim()).filter(Boolean),
          medications: form.medications.split(',').map((s) => s.trim()).filter(Boolean),
          consentAiDisclosure: form.consentAiDisclosure,
          consentTerms: form.consentTerms,
          consentPrivacy: form.consentPrivacy,
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl">Patient profile</h1>
      <p className="mt-2 text-sm text-ink-700">
        Optional health details help the AI ask better questions. Sensitive fields are only stored with your consent.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-brand-900/10 bg-white/85 p-6 shadow-soft">
        {(
          [
            ['displayName', 'Display name'],
            ['preferredLanguage', 'Preferred language'],
            ['country', 'Country'],
            ['region', 'Region / state'],
            ['allergies', 'Known allergies (comma-separated, optional)'],
            ['conditions', 'Existing conditions (optional)'],
            ['medications', 'Current medications (optional)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.consentAiDisclosure} onChange={(e) => setForm((f) => ({ ...f, consentAiDisclosure: e.target.checked }))} />
          I understand the assistant is AI-generated and not a licensed physician.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.consentTerms} onChange={(e) => setForm((f) => ({ ...f, consentTerms: e.target.checked }))} />
          I accept the Terms of Service.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.consentPrivacy} onChange={(e) => setForm((f) => ({ ...f, consentPrivacy: e.target.checked }))} />
          I accept the Privacy Policy.
        </label>
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">
          Save profile
        </button>
        {saved && <p className="text-sm text-brand-800">Saved.</p>}
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </form>
    </div>
  );
}
