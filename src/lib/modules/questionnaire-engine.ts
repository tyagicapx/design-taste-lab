import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/questionnaire';
import {
  getSession,
  getRound,
  createRound,
  updateRoundQuestionnaire,
} from '../db/queries';
import { Question } from '../types';
import { parseJsonResponse } from '../utils/json';
import { DEFAULT_CLAUDE_MODEL } from '../constants';


export async function generateQuestionnaire(
  sessionId: string,
  roundNumber: number
): Promise<Question[]> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Get previous round data for rounds 2-3
  let previousAnswers: unknown = undefined;
  let previousDeltas: unknown = undefined;

  if (roundNumber > 1) {
    const prevRound = getRound(sessionId, roundNumber - 1);
    if (prevRound) {
      previousAnswers = prevRound.answers;
      previousDeltas = prevRound.preferenceDeltas;
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    roundNumber,
    session.tasteMap,
    session.criticOutput,
    previousAnswers,
    previousDeltas,
    session.onboardingData,
    session.clusters
  );

  const result = await trackApiCall(
    sessionId,
    'questionnaire_engine',
    'claude',
    DEFAULT_CLAUDE_MODEL,
    () =>
      textProvider.generateText({
        systemPrompt,
        userPrompt,
        maxTokens: 4096,
      })
  );

  const parsed = parseJsonResponse(result.text) as {
    questions: Question[];
  };
  const questions = parsed.questions;

  // Create or update the round record
  let round = getRound(sessionId, roundNumber);
  if (!round) {
    createRound(sessionId, roundNumber);
    round = getRound(sessionId, roundNumber);
  }

  if (round) {
    updateRoundQuestionnaire(round.id, questions);
  }

  return questions;
}
