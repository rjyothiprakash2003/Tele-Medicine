import { suggestMedicinesFromText } from './medicine-suggestions';

describe('suggestMedicinesFromText', () => {
  it('suggests fever/pain medicines for sore throat fever', () => {
    const meds = suggestMedicinesFromText('I have fever and sore throat for two days');
    expect(meds.some((m) => /paracetamol/i.test(m.name))).toBe(true);
    expect(meds.length).toBeGreaterThan(0);
  });

  it('respects paracetamol allergy', () => {
    const meds = suggestMedicinesFromText('fever and headache', ['Paracetamol']);
    expect(meds.every((m) => !/paracetamol/i.test(m.name))).toBe(true);
  });

  it('suggests ORS for diarrhea', () => {
    const meds = suggestMedicinesFromText('loose motion and diarrhea since yesterday');
    expect(meds.some((m) => /ORS/i.test(m.name))).toBe(true);
  });
});
