'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';

export default function AdminPage() {
  const [key, setKey] = useState('');
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api('/admin/metrics', {
        headers: { 'x-admin-key': key },
      });
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Admin access failed');
    }
  }

  const chartData =
    metrics?.appointmentStats?.map((s: any) => ({
      name: s.status,
      count: s._count,
    })) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl">Administrator dashboard</h1>
      <p className="mt-2 text-sm text-ink-700">
        Platform operations only. Aggregated metrics by default. No doctor module. Admin key required.
      </p>
      <div className="mt-6 flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="x-admin-key"
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <button type="button" onClick={load} className="rounded-xl bg-ink-900 px-4 py-2 text-sm text-white">
          Load metrics
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
      {metrics && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat label="Users" value={metrics.totalRegisteredUsers} />
          <Stat label="Consultations" value={metrics.consultationsTotal} />
          <Stat label="Completed" value={metrics.consultationsCompleted} />
          <Stat label="Emergency stops" value={metrics.emergencyStops} />
          <Stat label="Documents" value={metrics.storageDocuments} />
          <Stat label="AI provider" value={`${metrics.aiProvider.name}${metrics.aiProvider.mock ? ' (mock)' : ''}`} />
          <div className="md:col-span-3 rounded-3xl border border-brand-900/10 bg-white/85 p-4">
            <h2 className="font-display text-xl">Appointment statuses</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-ink-700">
              Roles: {metrics.rolesDefined?.join(', ')}. Doctor role exists: {String(metrics.doctorRoleExists)}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-brand-900/10 bg-white/85 p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-brand-700">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
