import { MedicalAIProvider, MedicalAIRequest, MedicalAIResponse } from './ai.interfaces';

const SYSTEM = `You are TELEMEDICINE AI, an AI health information assistant.
You are NOT a licensed physician and must never claim to be one.
Never guarantee a diagnosis or treatment.
Never invent citations.
Ask focused follow-up questions rather than immediately listing diagnoses.
If emergency symptoms appear, urge immediate emergency care.
Do not produce legally valid prescriptions. Medication suggestions must be educational only.
Always include a brief AI disclaimer.`;

export class OpenAIMedicalProvider implements MedicalAIProvider {
  readonly name = 'openai-compatible';

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async generate(request: MedicalAIRequest): Promise<MedicalAIResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'system', content: SYSTEM }, ...request.messages],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Medical AI provider error: ${res.status} ${body}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty medical AI response');

    return {
      content,
      provider: this.name,
      model: this.model,
      mock: false,
      requestId: request.requestId,
    };
  }
}
