'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, apiUrl } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Dashboard = {
  profile: { displayName?: string | null };
  upcomingAppointments: Array<{ id: string; scheduledAt: string; mode: string; status: string }>;
  recentConsultations: Array<{
    id: string;
    tokenNumber: string;
    mode: string;
    status: string;
    createdAt: string;
    prescriptions?: Array<{ id: string }>;
  }>;
  notifications: Array<{ id: string; title: string; body: string; createdAt: string }>;
  documents: Array<{ id: string; fileName: string; type: string }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenLookup, setTokenLookup] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await api<Dashboard>('/patients/me/dashboard');
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function findToken() {
    if (!tokenLookup.trim()) return;
    try {
      const c = await api<{ id: string }>(`/conversations/token/${tokenLookup.trim()}`);
      window.location.href = `/consultations/${c.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Token not found');
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-14 text-ink-700">Loading dashboard…</div>;
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-rose-700">{error}</p>
        <button type="button" onClick={load} className="mt-3 rounded-full bg-brand-700 px-4 py-2 text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-brand-900/10 bg-white/85 p-6 shadow-soft">
        <h1 className="font-display text-3xl text-ink-900">
          Welcome{data?.profile.displayName ? `, ${data.profile.displayName}` : ''}
        </h1>
        <p className="mt-2 text-ink-700">
          No login required — this dashboard uses your private browser session.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/consult/chat" className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Start AI chat
          </Link>
          <Link href="/consult/video" className="rounded-full border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-800">
            Start AI video
          </Link>
          <Link href="/appointments" className="rounded-full border border-brand-900/15 px-4 py-2 text-sm">
            Schedule AI session
          </Link>
          <Link href="/profile" className="rounded-full border border-brand-900/15 px-4 py-2 text-sm">
            Profile & privacy
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-brand-900/10 bg-white/80 p-4">
        <input
          value={tokenLookup}
          onChange={(e) => setTokenLookup(e.target.value)}
          placeholder="Look up consultation by token (e.g. TM-20261108-00001)"
          className="min-w-[260px] flex-1 rounded-xl border border-brand-900/15 px-3 py-2 text-sm"
        />
        <button type="button" onClick={findToken} className="rounded-xl bg-ink-900 px-4 py-2 text-sm text-white">
          Find token
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Upcoming AI sessions">
          {data?.upcomingAppointments.length ? (
            <ul className="space-y-2 text-sm">
              {data.upcomingAppointments.map((a) => (
                <li key={a.id} className="rounded-xl bg-ink-50 px-3 py-2">
                  {a.mode} · {formatDate(a.scheduledAt)} · {a.status}
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No upcoming sessions. Schedule an AI chat or video appointment." />
          )}
        </Section>

        <Section title="Recent consultation reports">
          {data?.recentConsultations.length ? (
            <ul className="space-y-2 text-sm">
              {data.recentConsultations.map((c) => (
                <li key={c.id} className="rounded-xl bg-ink-50 px-3 py-2">
                  <Link href={`/consultations/${c.id}`} className="font-mono text-brand-800">
                    {c.tokenNumber}
                  </Link>{' '}
                  · {c.mode} · {c.status}
                  {c.prescriptions && c.prescriptions.length > 0 && (
                    <span className="ml-2 text-xs text-brand-700">AI Rx record saved</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No consultations yet. Start an AI chat to create your first token." />
          )}
        </Section>

        <Section title="Saved documents">
          {data?.documents.length ? (
            <ul className="space-y-2 text-sm">
              {data.documents.map((d) => (
                <li key={d.id} className="rounded-xl bg-ink-50 px-3 py-2">
                  <a
                    href={apiUrl(`/medical-documents/${d.id}/download`)}
                    className="text-brand-800 underline"
                  >
                    {d.fileName}
                  </a>{' '}
                  <span className="text-xs text-ink-700">({d.type})</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No documents uploaded yet." />
          )}
        </Section>

        <Section title="Notifications">
          {data?.notifications.length ? (
            <ul className="space-y-2 text-sm">
              {data.notifications.map((n) => (
                <li key={n.id} className="rounded-xl bg-ink-50 px-3 py-2">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-ink-700">{n.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No notifications yet." />
          )}
        </Section>
      </div>
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-brand-900/10 bg-white/80 p-5 shadow-soft">
      <h2 className="font-display text-xl text-ink-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-ink-700">{text}</p>;
}
