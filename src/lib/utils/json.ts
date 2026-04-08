/**
 * Shared JSON response parser for AI module outputs.
 *
 * Fixes:
 * - P0: Greedy regex that matched wrong JSON object
 * - P0: Zero validation after JSON.parse (blind `as` casts)
 * - P1: Duplicated 9 times across modules
 */

/**
 * Extract and parse a JSON object from an AI response string.
 *
 * Uses a bracket-counting approach instead of greedy regex to find
 * the correct outermost JSON object boundary.
 */
export function parseJsonResponse<T = unknown>(text: string, requiredKeys?: string[]): T {
  // Strategy 1: Try parsing the entire text as JSON (cleanest case)
  try {
    const result = JSON.parse(text) as T;
    if (requiredKeys) {
      validateJsonShape(result as Record<string, unknown>, requiredKeys, 'parseJsonResponse');
    }
    return result;
  } catch (e) {
    // If validation failed, re-throw; otherwise not pure JSON — need to extract
    if (e instanceof Error && e.message.includes('missing required fields')) throw e;
  }

  // Strategy 2: Find the first { and count brackets to find matching }
  const startIdx = text.indexOf('{');
  if (startIdx === -1) {
    throw new Error('No JSON object found in AI response');
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let endIdx = -1;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) {
    throw new Error('Malformed JSON in AI response — unmatched braces');
  }

  const jsonStr = text.slice(startIdx, endIdx + 1);

  let parsed: T;
  try {
    parsed = JSON.parse(jsonStr) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from AI response: ${err instanceof Error ? err.message : 'unknown error'}\n\nExtracted: ${jsonStr.slice(0, 200)}...`
    );
  }

  if (requiredKeys) {
    validateJsonShape(parsed as Record<string, unknown>, requiredKeys, 'parseJsonResponse');
  }

  return parsed;
}

/**
 * Validate that a parsed object has all required keys.
 * Throws a descriptive error if any are missing.
 */
export function validateJsonShape(
  data: Record<string, unknown>,
  requiredKeys: string[],
  context: string
): void {
  const missing = requiredKeys.filter((key) => !(key in data));
  if (missing.length > 0) {
    throw new Error(
      `AI response for ${context} is missing required fields: ${missing.join(', ')}`
    );
  }
}
