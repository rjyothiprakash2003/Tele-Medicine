export type SuggestedMedicine = {
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: string;
  purpose: string;
  category: 'otc_educational' | 'supportive';
};

/**
 * Educational OTC-style suggestions only.
 * Not a legally valid prescription. Used for AI-generated consultation records.
 */
export function suggestMedicinesFromText(text: string, allergies: string[] = []): SuggestedMedicine[] {
  const t = text.toLowerCase();
  const allergySet = allergies.map((a) => a.toLowerCase());
  const hasAllergy = (...names: string[]) =>
    names.some((n) => allergySet.some((a) => a.includes(n) || n.includes(a)));

  const picks: SuggestedMedicine[] = [];

  const feverOrPain =
    /\b(fever|temperature|pyrexia|headache|migraine|body pain|bodyache|sore throat|tooth|pain|ache)\b/.test(t);
  const coldCough = /\b(cold|cough|runny nose|congestion|sneeze|flu|sore throat)\b/.test(t);
  const allergyLike = /\b(allerg|itch|rash|hives|sneezing)\b/.test(t);
  const stomach = /\b(acidity|heartburn|gas|indigestion|nausea|vomit|stomach|diarrh|loose motion)\b/.test(t);
  const muscle = /\b(sprain|muscle|back pain|joint|strain)\b/.test(t);

  if (feverOrPain && !hasAllergy('paracetamol', 'acetaminophen')) {
    picks.push({
      name: 'Paracetamol (Acetaminophen)',
      strength: '500 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Every 6–8 hours as needed (max 3–4 g/day adults)',
      duration: 'Up to 3 days unless advised otherwise by a clinician',
      purpose: 'Fever / mild-moderate pain relief (educational suggestion)',
      category: 'otc_educational',
    });
  }

  if ((feverOrPain || muscle) && !hasAllergy('ibuprofen', 'nsaid')) {
    picks.push({
      name: 'Ibuprofen',
      strength: '200–400 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Every 6–8 hours after food as needed',
      duration: 'Short course only; avoid if ulcer/kidney issues/pregnancy concerns',
      purpose: 'Inflammatory pain / fever (educational suggestion)',
      category: 'otc_educational',
    });
  }

  if (coldCough) {
    picks.push({
      name: 'Cetirizine',
      strength: '10 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Once daily at night',
      duration: '3–5 days if allergy/cold symptoms persist',
      purpose: 'Runny nose / sneezing / mild allergy symptoms',
      category: 'otc_educational',
    });
    picks.push({
      name: 'Saline nasal drops / spray',
      strength: 'Isotonic',
      form: 'Nasal spray',
      dosage: '2–3 sprays per nostril',
      frequency: '2–3 times daily',
      duration: 'As needed',
      purpose: 'Nasal congestion supportive care',
      category: 'supportive',
    });
  }

  if (allergyLike && !picks.some((p) => p.name.startsWith('Cetirizine'))) {
    picks.push({
      name: 'Cetirizine',
      strength: '10 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: 'As needed for allergic symptoms',
      purpose: 'Allergy symptom relief (educational)',
      category: 'otc_educational',
    });
  }

  if (stomach) {
    if (/\b(acidity|heartburn|indigestion|gas)\b/.test(t)) {
      picks.push({
        name: 'Omeprazole',
        strength: '20 mg',
        form: 'Capsule',
        dosage: '1 capsule',
        frequency: 'Once daily before breakfast',
        duration: 'Up to 7–14 days if mild acidity; seek care if severe',
        purpose: 'Acidity / heartburn educational suggestion',
        category: 'otc_educational',
      });
      picks.push({
        name: 'Antacid (Aluminum hydroxide + Magnesium hydroxide)',
        strength: 'Standard OTC',
        form: 'Tablet / Suspension',
        dosage: 'As per label',
        frequency: 'After meals / when symptomatic',
        duration: 'Short term',
        purpose: 'Quick symptomatic relief for acidity',
        category: 'otc_educational',
      });
    }
    if (/\b(diarrh|loose motion)\b/.test(t)) {
      picks.push({
        name: 'ORS (Oral Rehydration Salts)',
        strength: 'WHO formula',
        form: 'Powder / solution',
        dosage: '1 glass after each loose stool',
        frequency: 'As needed',
        duration: 'Until hydration improves',
        purpose: 'Prevent dehydration',
        category: 'supportive',
      });
    }
  }

  // Always include supportive non-drug advice as medicines list companion if empty
  if (picks.length === 0) {
    picks.push({
      name: 'Paracetamol (Acetaminophen)',
      strength: '500 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Every 6–8 hours as needed if pain/fever present',
      duration: 'Only if symptoms of pain/fever occur',
      purpose: 'General mild symptom support (educational default)',
      category: 'otc_educational',
    });
    picks.push({
      name: 'Adequate oral fluids + rest',
      strength: 'N/A',
      form: 'Supportive care',
      dosage: 'Frequent sips of water',
      frequency: 'Throughout the day',
      duration: 'Until recovery',
      purpose: 'Non-drug supportive measure',
      category: 'supportive',
    });
  }

  // Filter out allergy conflicts again by name keyword
  return picks
    .filter((m) => !hasAllergy(...m.name.toLowerCase().split(/[^a-z]+/).filter(Boolean)))
    .slice(0, 5);
}
