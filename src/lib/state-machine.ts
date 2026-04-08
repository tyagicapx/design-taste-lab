import { SessionStatus } from './types';

const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  uploading: ['onboarding', 'annotating', 'analyzing'], // V2: can go to onboarding first
  onboarding: ['uploading', 'annotating', 'analyzing'], // V2: after onboard, go to upload
  annotating: ['analyzing'],
  analyzing: ['reviewing'], // V2: goes to review instead of directly to round 1
  reviewing: ['round_1_questionnaire'], // V2: after cluster/outlier review
  round_1_questionnaire: ['round_1_probes'],
  round_1_probes: ['round_1_compare', 'round_2_questionnaire', 'compiling'], // V2: can skip to compile if confident
  round_1_compare: ['round_2_questionnaire', 'compiling'], // V2: compare flow
  round_2_questionnaire: ['round_2_probes'],
  round_2_probes: ['round_2_compare', 'round_3_questionnaire', 'compiling'], // V2: adaptive — can skip to compile
  round_2_compare: ['round_3_questionnaire', 'compiling'], // V2: compare flow
  round_3_questionnaire: ['round_3_probes'],
  round_3_probes: ['round_3_compare', 'compiling'],
  round_3_compare: ['compiling'],
  compiling: ['complete'],
  complete: [],
  error: ['uploading', 'analyzing'],
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  uploading: 'Upload References',
  onboarding: 'Getting to Know You',
  annotating: 'Annotate References',
  analyzing: 'Analyzing...',
  reviewing: 'Review Clusters',
  round_1_questionnaire: 'Round 1 — Questionnaire',
  round_1_probes: 'Round 1 — Probes',
  round_1_compare: 'Round 1 — Compare',
  round_2_questionnaire: 'Round 2 — Questionnaire',
  round_2_probes: 'Round 2 — Probes',
  round_2_compare: 'Round 2 — Compare',
  round_3_questionnaire: 'Round 3 — Questionnaire',
  round_3_probes: 'Round 3 — Probes',
  round_3_compare: 'Round 3 — Compare',
  compiling: 'Compiling Taste Spec...',
  complete: 'Complete',
  error: 'Error — Please Retry',
};

export function canTransition(
  current: SessionStatus,
  next: SessionStatus
): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

export function getNextStatuses(current: SessionStatus): SessionStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function getStatusLabel(status: SessionStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getCurrentRound(status: SessionStatus): number | null {
  if (status.startsWith('round_1')) return 1;
  if (status.startsWith('round_2')) return 2;
  if (status.startsWith('round_3')) return 3;
  return null;
}

export function isAnalyzing(status: SessionStatus): boolean {
  return status === 'analyzing' || status === 'compiling';
}

export function isComplete(status: SessionStatus): boolean {
  return status === 'complete';
}

export function getProgress(status: SessionStatus): number {
  if (status === 'error') return 0;
  const order: SessionStatus[] = [
    'uploading',
    'onboarding',
    'annotating',
    'analyzing',
    'reviewing',
    'round_1_questionnaire',
    'round_1_probes',
    'round_1_compare',
    'round_2_questionnaire',
    'round_2_probes',
    'round_2_compare',
    'round_3_questionnaire',
    'round_3_probes',
    'round_3_compare',
    'compiling',
    'complete',
  ];
  const idx = order.indexOf(status);
  return idx === -1 ? 0 : Math.round((idx / (order.length - 1)) * 100);
}
