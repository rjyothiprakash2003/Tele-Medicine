import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MedicalAIProvider, MedicalAIRequest, MedicalAIResponse } from './ai.interfaces';
import { MockMedicalAIProvider } from './mock-medical.provider';
import { OpenAIMedicalProvider } from './openai-medical.provider';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class AiService {
  private readonly provider: MedicalAIProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly safety: SafetyService,
  ) {
    const mode = (this.config.get<string>('AI_PROVIDER') ?? 'mock').toLowerCase();
    const key = this.config.get<string>('OPENAI_API_KEY');
    if (mode !== 'mock' && key) {
      this.provider = new OpenAIMedicalProvider(
        key,
        this.config.get<string>('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1',
        this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
      );
    } else {
      this.provider = new MockMedicalAIProvider();
    }
  }

  getProviderName() {
    return this.provider.name;
  }

  isMock() {
    return this.provider.name === 'mock';
  }

  async generateSafe(request: MedicalAIRequest): Promise<MedicalAIResponse & { safetyBlocked?: boolean }> {
    const draft = await this.provider.generate(request);
    const check = this.safety.evaluateAssistantText(draft.content);
    if (check.blockResponse) {
      return {
        content:
          'I cannot provide that response because it may be unsafe or misleading. Please rephrase your question, or seek care from a qualified clinician / emergency services if needed. I am an AI assistant, not a licensed physician.',
        provider: draft.provider,
        model: draft.model,
        mock: draft.mock,
        requestId: draft.requestId,
        safetyBlocked: true,
      };
    }
    return draft;
  }

  async *streamSafe(request: MedicalAIRequest): AsyncGenerator<string, void, unknown> {
    if (!this.provider.stream) {
      const full = await this.generateSafe(request);
      yield full.content;
      return;
    }
    let acc = '';
    for await (const chunk of this.provider.stream(request)) {
      acc += chunk;
      yield chunk;
    }
    const check = this.safety.evaluateAssistantText(acc);
    if (check.blockResponse) {
      yield '\n\n[Safety filter replaced an unsafe draft. Please seek qualified medical care if needed.]';
    }
  }
}
