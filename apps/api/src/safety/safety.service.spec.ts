import { SafetyService } from './safety.service';

describe('SafetyService', () => {
  const prisma = { safetyEvent: { create: jest.fn() } } as never;
  const config = {
    get: (k: string) => {
      if (k === 'EMERGENCY_NUMBER') return '112';
      if (k === 'EMERGENCY_AMBULANCE') return '108';
      if (k === 'EMERGENCY_REGION') return 'IN';
      return undefined;
    },
  } as never;

  const service = new SafetyService(prisma, config);

  it('detects chest pain emergency patterns deterministically', () => {
    const result = service.evaluateUserText('I have crushing chest pain and sweating');
    expect(result.isEmergency).toBe(true);
    expect(result.severity).toBe('EMERGENCY');
    expect(result.emergencyGuidance?.primaryNumber).toBe('112');
  });

  it('detects stroke signs', () => {
    const result = service.evaluateUserText('sudden weakness on one side and slurred speech');
    expect(result.isEmergency).toBe(true);
  });

  it('blocks physician impersonation in assistant text', () => {
    const result = service.evaluateAssistantText('I am a doctor and I diagnose you with flu');
    expect(result.blockResponse).toBe(true);
  });

  it('allows AI disclaimer mentioning licensed physician negation', () => {
    const result = service.evaluateAssistantText(
      'I am an AI health information assistant, not a licensed physician.',
    );
    expect(result.blockResponse).toBe(false);
  });

  it('allows ordinary low-risk text', () => {
    const result = service.evaluateUserText('I have a mild sore throat for two days');
    expect(result.isEmergency).toBe(false);
  });
});
