import { ChatConsultation } from '@/components/chat-consultation';

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl text-ink-900">AI health chat</h1>
      <p className="mt-2 text-ink-700">
        Streamlined consultation with guided questions, safety checks, token numbers, and optional
        prior prescription uploads. No login required.
      </p>
      <div className="mt-8">
        <ChatConsultation mode="CHAT" />
      </div>
    </div>
  );
}
