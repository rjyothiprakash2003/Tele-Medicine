'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, apiUrl } from '@/lib/api';
import { MedicineItem, PrescriptionCard } from '@/components/prescription-card';

export default function ConsultationDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function load() {
    const c = await api(`/conversations/${params.id}`);
    setData(c);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [params.id]);

  const medicines: MedicineItem[] = useMemo(() => {
    const fromRx =
      data?.prescriptions?.flatMap(
        (p: any) => (p.structuredContent?.medicines as MedicineItem[] | undefined) ?? [],
      ) ?? [];
    if (fromRx.length) return fromRx;
    return (
      data?.treatments?.map((t: any) => ({
        name: t.title,
        strength: '',
        form: 'AI suggestion',
        dosage: t.content,
        frequency: '',
        duration: '',
        purpose: 'Educational treatment recommendation',
      })) ?? []
    );
  }, [data]);

  const latestRxId = data?.prescriptions?.[0]?.id as string | undefined;

  async function generateRx() {
    setGenerating(true);
    setError(null);
    try {
      await api(`/prescriptions/consultation/${params.id}/generate`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate prescription');
    } finally {
      setGenerating(false);
    }
  }

  if (error && !data) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-rose-700">{error}</div>;
  }
  if (!data) return <div className="mx-auto max-w-4xl px-4 py-10">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl">Consultation {data.tokenNumber}</h1>
      <p className="mt-1 text-sm text-ink-700">
        {data.mode} · {data.status}
      </p>

      {(medicines.length > 0 || latestRxId) && (
        <div className="mt-6">
          <PrescriptionCard
            tokenNumber={data.tokenNumber}
            prescriptionId={latestRxId}
            medicines={medicines}
          />
        </div>
      )}

      {!latestRxId && data.status !== 'EMERGENCY_STOPPED' && (
        <div className="mt-6 rounded-3xl border border-dashed border-brand-700/40 bg-white/80 p-5">
          <p className="text-sm text-ink-700">
            No AI prescription image yet. Generate one with medicines based on this consultation.
          </p>
          <button
            type="button"
            disabled={generating}
            onClick={generateRx}
            className="mt-3 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {generating ? 'Generating…' : 'Generate AI prescription & medicines'}
          </button>
        </div>
      )}

      {data.summary && (
        <section className="mt-6 rounded-3xl border border-brand-900/10 bg-white/85 p-5">
          <h2 className="font-display text-xl">Summary</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{data.summary.summaryText}</pre>
          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-rose-700">
            AI Generated
          </p>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-brand-900/10 bg-white/85 p-5">
        <h2 className="font-display text-xl">Transcript</h2>
        <div className="mt-3 space-y-2 text-sm">
          {data.messages?.map((m: any) => (
            <div key={m.id} className="rounded-xl bg-ink-50 px-3 py-2">
              <span className="text-xs uppercase text-brand-700">{m.role}</span>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-brand-900/10 bg-white/85 p-5">
        <h2 className="font-display text-xl">Reports</h2>
        {data.reports?.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {data.reports.map((r: any) => (
              <li key={r.id}>
                {r.title}{' '}
                <button
                  type="button"
                  className="text-brand-800 underline"
                  onClick={async () => {
                    const res = await fetch(apiUrl(`/reports/${r.id}/export`), {
                      method: 'POST',
                      credentials: 'include',
                    });
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `report-${r.id}.pdf`;
                    a.click();
                  }}
                >
                  Download PDF
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-700">No PDF report yet.</p>
        )}
      </section>

      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

      <p className="mt-8 text-center text-xs font-semibold uppercase tracking-wide text-rose-700">
        AI Generated — Not a legally valid prescription
      </p>
    </div>
  );
}
