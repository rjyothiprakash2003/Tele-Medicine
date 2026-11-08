import { UserRole } from '@telemedicine/shared';

describe('RBAC', () => {
  it('does not define a DOCTOR role', () => {
    expect(Object.keys(UserRole)).toEqual(['PATIENT', 'ADMINISTRATOR', 'SYSTEM_SERVICE']);
    expect((UserRole as Record<string, string>).DOCTOR).toBeUndefined();
  });
});
