'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Appointment = {
  id: string;
  mode: string;
  status: string;
  scheduledAt: string;
  reason?: string | null;
};

export default function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [mode, setMode] = useState<'CHAT' | 'VIDEO'>('VIDEO');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  const [avatarGender, setAvatarGender] = useState<'FEMALE' | 'MALE'>('FEMALE');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setItems(await api<Appointment[]>('/appointments'));
  }

  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          scheduledAt: new Date(scheduledAt).toISOString(),
          reason,
          avatarGender,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      setReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    }
  }

  async function cancel(id: string) {
    await api(`/appointments/${id}/cancel`, { method: 'POST' });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">Schedule an AI consultation</h1>
      <p className="mt-2 text-ink-700">
        Appointments are for AI sessions only. There is no human-doctor calendar.
      </p>

      <form onSubmit={create} className="mt-8 space-y-3 rounded-3xl border border-brand-900/10 bg-white/85 p-5 shadow-soft">
        <label className="block text-sm">
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as 'CHAT' | 'VIDEO')} className="mt-1 w-full rounded-xl border px-3 py-2">
            <option value="VIDEO">AI Video</option>
            <option value="CHAT">AI Chat</option>
          </select>
        </label>
        <label className="block text-sm">
          Avatar
          <select value={avatarGender} onChange={(e) => setAvatarGender(e.target.value as 'FEMALE' | 'MALE')} className="mt-1 w-full rounded-xl border px-3 py-2">
            <option value="FEMALE">Female presentation</option>
            <option value="MALE">Male presentation</option>
          </select>
        </label>
        <label className="block text-sm">
          Date & time
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Reason (optional)
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} />
        </label>
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">
          Confirm AI session
        </button>
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </form>

      <h2 className="mt-10 font-display text-2xl">Your appointments</h2>
      <ul className="mt-4 space-y-2">
        {items.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-2xl border border-brand-900/10 bg-white/80 px-4 py-3 text-sm">
            <span>
              {a.mode} · {formatDate(a.scheduledAt)} · {a.status}
            </span>
            {['SCHEDULED', 'CONFIRMED'].includes(a.status) && (
              <button type="button" onClick={() => cancel(a.id)} className="text-rose-700">
                Cancel
              </button>
            )}
          </li>
        ))}
        {!items.length && <li className="text-sm text-ink-700">No appointments yet.</li>}
      </ul>
    </div>
  );
}
