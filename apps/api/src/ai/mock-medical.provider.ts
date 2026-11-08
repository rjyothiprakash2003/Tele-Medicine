import { MedicalAIProvider, MedicalAIRequest, MedicalAIResponse } from './ai.interfaces';

const DISCLAIMER =
  'I am an AI health information assistant, not a licensed physician. This is not a diagnosis or a legally valid prescription.';

export class MockMedicalAIProvider implements MedicalAIProvider {
  readonly name = 'mock';

  async generate(request: MedicalAIRequest): Promise<MedicalAIResponse> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const mode = request.mode ?? 'chat';

    let content: string;
    if (mode === 'summary') {
      content = [
        '## Consultation summary (AI-generated)',
        `- Main concern: ${lastUser.slice(0, 160) || 'Not clearly stated'}`,
        '- Reported information was reviewed conversationally.',
        '- Possible explanations are hypotheses only and require clinical evaluation.',
        '- Recommended next steps: monitor symptoms, seek in-person care if worsening, and use emergency services for red-flag symptoms.',
        '',
        DISCLAIMER,
      ].join('\n');
    } else if (mode === 'assessment') {
      content = [
        'Thank you for describing your concern. Based on what you shared, I will keep questions focused.',
        '',
        '1) When did this start?',
        '2) How severe is it on a scale of 1–10?',
        '3) Are there associated symptoms (fever, dizziness, swelling, bleeding)?',
        '',
        'I will not present a confirmed diagnosis. Any possible conditions will be framed as uncertain possibilities.',
        '',
        DISCLAIMER,
      ].join('\n');
    } else if (mode === 'prescription_review') {
      content = [
        'Based on the consultation, an AI medicines list has been prepared for the educational prescription record.',
        'Suggested items may include common OTC options such as Paracetamol for fever/pain, Cetirizine for cold/allergy symptoms, or supportive ORS/fluids when relevant.',
        'Doses shown are educational examples for adults unless otherwise noted.',
        'This record is AI-generated and is NOT a legally valid prescription.',
        'A licensed clinician must review and prescribe medications where required by law.',
        '',
        DISCLAIMER,
      ].join('\n');
    } else {
      content = [
        `I understand you said: "${lastUser.slice(0, 240)}"`,
        '',
        'To help safely, please share:',
        '- Duration and progression',
        '- Severity and what makes it better/worse',
        '- Relevant allergies or current medicines (optional)',
        '',
        'If you have chest pain with breathlessness, stroke signs, severe bleeding, or trouble breathing, seek emergency care now.',
        '',
        DISCLAIMER,
      ].join('\n');
    }

    return {
      content,
      provider: this.name,
      model: 'mock-medical-v1',
      mock: true,
      requestId: request.requestId,
    };
  }

  async *stream(request: MedicalAIRequest): AsyncGenerator<string, void, unknown> {
    const full = await this.generate(request);
    const chunks = full.content.match(/.{1,40}/gs) ?? [full.content];
    for (const chunk of chunks) {
      yield chunk;
      await new Promise((r) => setTimeout(r, 15));
    }
  }
}
