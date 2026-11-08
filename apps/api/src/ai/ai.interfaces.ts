export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type MedicalAIRequest = {
  messages: ChatMessage[];
  language?: string;
  mode?: 'chat' | 'assessment' | 'summary' | 'prescription_review';
  requestId?: string;
};

export type MedicalAIResponse = {
  content: string;
  provider: string;
  model: string;
  mock: boolean;
  requestId?: string;
};

export interface MedicalAIProvider {
  readonly name: string;
  generate(request: MedicalAIRequest): Promise<MedicalAIResponse>;
  stream?(request: MedicalAIRequest): AsyncGenerator<string, void, unknown>;
}

export interface SpeechToTextProvider {
  readonly name: string;
  transcribe(audioBase64: string, mimeType: string): Promise<{ text: string; mock: boolean }>;
}

export interface TextToSpeechProvider {
  readonly name: string;
  synthesize(text: string, voiceId?: string): Promise<{ audioBase64: string; mimeType: string; mock: boolean }>;
}

export interface AvatarProvider {
  readonly name: string;
  createSession(params: {
    consultationId: string;
    gender: 'MALE' | 'FEMALE';
    voiceId?: string;
  }): Promise<{ sessionId: string; clientToken?: string; mock: boolean }>;
  interrupt(sessionId: string): Promise<void>;
  end(sessionId: string): Promise<void>;
}

export interface SafetyEvaluationProvider {
  readonly name: string;
}
