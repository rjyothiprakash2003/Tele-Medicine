export type EmergencyRule = {
  id: string;
  pattern: RegExp;
  message: string;
};

/** Deterministic high-priority emergency patterns — not LLM-only. */
export const EMERGENCY_RULES: EmergencyRule[] = [
  {
    id: 'chest_pain_distress',
    pattern: /\b(crushing chest pain|chest pain.*(shortness of breath|sweating)|heart attack)\b/i,
    message: 'Possible cardiac emergency symptoms reported.',
  },
  {
    id: 'stroke_signs',
    pattern: /\b(face droop|sudden weakness on one side|slurred speech|stroke)\b/i,
    message: 'Possible stroke warning signs reported.',
  },
  {
    id: 'severe_breathing',
    pattern: /\b(cannot breathe|can't breathe|severe shortness of breath|choking)\b/i,
    message: 'Severe breathing difficulty reported.',
  },
  {
    id: 'unconscious',
    pattern: /\b(unconscious|unresponsive|passed out and not waking)\b/i,
    message: 'Altered consciousness reported.',
  },
  {
    id: 'severe_bleeding',
    pattern: /\b(uncontrolled bleeding|bleeding that will not stop|hemorrhage)\b/i,
    message: 'Severe bleeding reported.',
  },
  {
    id: 'suicidal',
    pattern: /\b(kill myself|suicide|want to die|end my life)\b/i,
    message: 'Self-harm crisis language detected.',
  },
  {
    id: 'anaphylaxis',
    pattern: /\b(anaphylaxis|throat swelling|severe allergic reaction.*(breath|swell))\b/i,
    message: 'Possible severe allergic reaction reported.',
  },
  {
    id: 'pregnancy_emergency',
    pattern: /\b(pregnant).*(heavy bleeding|severe abdominal pain|no fetal movement)\b/i,
    message: 'Possible obstetric emergency symptoms reported.',
  },
];

export const DANGEROUS_ADVICE_PATTERNS: RegExp[] = [
  /\bignore emergency\b/i,
  /\bstop taking (all )?medications? without\b/i,
  /\btake (double|extra) dose\b/i,
];
