'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

export type MedicineItem = {
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: string;
  purpose: string;
  category?: string;
};

type Props = {
  tokenNumber?: string;
  prescriptionId?: string;
  medicines?: MedicineItem[];
};

export function PrescriptionCard({
  tokenNumber,
  prescriptionId,
  medicines = [],
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const downloadHref = prescriptionId
    ? apiUrl(`/prescriptions/${prescriptionId}/download`)
    : null;

  useEffect(() => {
    if (!prescriptionId) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(apiUrl(`/prescriptions/${prescriptionId}/download`), {
          credentials: 'include',
        });
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        // preview optional
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [prescriptionId]);

  async function downloadImage() {
    if (!prescriptionId) return;
    const res = await fetch(apiUrl(`/prescriptions/${prescriptionId}/download`), {
      credentials: 'include',
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-prescription-${tokenNumber ?? prescriptionId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-3xl border border-brand-900/15 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl text-ink-900">AI prescription &amp; medicines</h3>
          {tokenNumber && (
            <p className="mt-1 font-mono text-sm text-brand-800">Token {tokenNumber}</p>
          )}
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
          AI GENERATED
        </span>
      </div>

      {medicines.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-900/10 text-xs uppercase tracking-wide text-brand-700">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Medicine</th>
                <th className="py-2 pr-2">Dose</th>
                <th className="py-2 pr-2">Frequency</th>
                <th className="py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m, i) => (
                <tr key={`${m.name}-${i}`} className="border-b border-ink-100 align-top">
                  <td className="py-3 pr-2 text-ink-700">{i + 1}</td>
                  <td className="py-3 pr-2">
                    <p className="font-semibold text-ink-900">{m.name}</p>
                    <p className="text-xs text-ink-700">
                      {m.form} · {m.strength}
                    </p>
                    <p className="mt-1 text-xs text-ink-700">{m.purpose}</p>
                  </td>
                  <td className="py-3 pr-2">{m.dosage}</td>
                  <td className="py-3 pr-2">{m.frequency}</td>
                  <td className="py-3">{m.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-700">No medicines listed yet.</p>
      )}

      {previewUrl && (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="AI generated prescription record"
            className="max-h-[520px] w-full rounded-2xl border border-brand-900/10 bg-ink-50 object-contain"
          />
        </div>
      )}

      {downloadHref && (
        <button
          type="button"
          onClick={downloadImage}
          className="mt-3 inline-flex rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Download AI prescription image
        </button>
      )}

      <p className="mt-5 border-t border-brand-900/10 pt-3 text-center text-xs font-semibold uppercase tracking-wide text-rose-700">
        AI Generated — Not a legally valid prescription. Confirm with a licensed clinician before taking medicines.
      </p>
    </div>
  );
}
