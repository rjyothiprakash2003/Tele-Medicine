export const ConversationState = {
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  LISTENING: 'LISTENING',
  TRANSCRIBING: 'TRANSCRIBING',
  PROCESSING: 'PROCESSING',
  SAFETY_REVIEW: 'SAFETY_REVIEW',
  SPEAKING: 'SPEAKING',
  INTERRUPTED: 'INTERRUPTED',
  RECONNECTING: 'RECONNECTING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
  EMERGENCY: 'EMERGENCY',
} as const;
export type ConversationState = (typeof ConversationState)[keyof typeof ConversationState];

/** Allowed transitions for the realtime conversation state machine. */
export const CONVERSATION_TRANSITIONS: Record<ConversationState, ConversationState[]> = {
  INITIALIZING: ['READY', 'ERROR'],
  READY: ['LISTENING', 'PROCESSING', 'COMPLETED', 'ERROR'],
  LISTENING: ['TRANSCRIBING', 'INTERRUPTED', 'COMPLETED', 'ERROR', 'RECONNECTING'],
  TRANSCRIBING: ['PROCESSING', 'ERROR', 'INTERRUPTED'],
  PROCESSING: ['SAFETY_REVIEW', 'SPEAKING', 'EMERGENCY', 'ERROR', 'INTERRUPTED'],
  SAFETY_REVIEW: ['SPEAKING', 'EMERGENCY', 'ERROR'],
  SPEAKING: ['LISTENING', 'READY', 'INTERRUPTED', 'COMPLETED', 'ERROR'],
  INTERRUPTED: ['LISTENING', 'READY', 'PROCESSING', 'ERROR'],
  RECONNECTING: ['READY', 'LISTENING', 'ERROR'],
  COMPLETED: [],
  ERROR: ['READY', 'RECONNECTING', 'COMPLETED'],
  EMERGENCY: ['COMPLETED', 'ERROR'],
};

export function canTransition(from: ConversationState, to: ConversationState): boolean {
  return CONVERSATION_TRANSITIONS[from]?.includes(to) ?? false;
}
