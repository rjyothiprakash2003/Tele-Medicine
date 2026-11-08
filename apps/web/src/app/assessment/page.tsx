import { ChatConsultation } from '@/components/chat-consultation';

export default function AssessmentPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl text-ink-900">Structured symptom assessment</h1>
      <p className="mt-2 text-ink-700">
        Describe your concern. The AI extracts symptoms, checks emergency warning signs, asks focused
        follow-ups, and explains uncertainty. Possible conditions are not confirmed diagnoses.
      </p>
      <div className="mt-8">
        <ChatConsultation mode="ASSESSMENT" />
      </div>
    </div>
  );
}
