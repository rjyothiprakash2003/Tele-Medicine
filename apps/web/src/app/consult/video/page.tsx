import { VideoConsultation } from '@/components/video-consultation';

export default function VideoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-ink-900">AI video consultation</h1>
      <p className="mt-2 max-w-3xl text-ink-700">
        Interact with a male or female AI avatar using microphone, captions, and interruptible speech.
        Production avatar providers can be configured later; mock mode is clearly labeled.
      </p>
      <div className="mt-8">
        <VideoConsultation />
      </div>
    </div>
  );
}
