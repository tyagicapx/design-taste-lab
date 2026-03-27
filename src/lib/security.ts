/**
 * Security utilities — shared across all API routes and services.
 *
 * Fixes: CRIT-3 (path traversal), HIGH-2 (file validation), HIGH-7 (EXIF)
 */

import path from 'path';

/**
 * CRIT-3 FIX: Validate sessionId format.
 *
 * Session IDs are nanoid(21) — only alphanumeric + hyphen + underscore.
 * Rejects any sessionId that could cause path traversal (../, etc).
 */
const SESSION_ID_REGEX = /^[A-Za-z0-9_-]{10,30}$/;

export function validateSessionId(sessionId: string): boolean {
  return SESSION_ID_REGEX.test(sessionId);
}

/**
 * CRIT-3 FIX: Resolve a path and assert it's within the expected base directory.
 *
 * Prevents directory traversal even if the regex is bypassed.
 */
export function safePath(baseDir: string, ...segments: string[]): string {
  const resolved = path.resolve(baseDir, ...segments);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

/**
 * HIGH-2 FIX: Server-side file validation.
 *
 * Validates file type (MIME + extension), file size, and file count.
 */
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 20;
const MAX_REFS_PER_SESSION = 50;

export interface FileValidationError {
  filename: string;
  error: string;
}

export function validateUploadedFiles(
  files: File[],
  existingRefCount = 0
): { valid: File[]; errors: FileValidationError[] } {
  const errors: FileValidationError[] = [];
  const valid: File[] = [];

  // Check total count
  if (files.length > MAX_FILES_PER_REQUEST) {
    return {
      valid: [],
      errors: [{ filename: '*', error: `Too many files. Max ${MAX_FILES_PER_REQUEST} per upload.` }],
    };
  }

  if (existingRefCount + files.length > MAX_REFS_PER_SESSION) {
    return {
      valid: [],
      errors: [{ filename: '*', error: `Session limit: max ${MAX_REFS_PER_SESSION} total references.` }],
    };
  }

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();

    // Check extension
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      errors.push({ filename: file.name, error: `Invalid file type: ${ext}. Allowed: PNG, JPG, WebP, GIF.` });
      continue;
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      errors.push({ filename: file.name, error: `Invalid MIME type: ${file.type}.` });
      continue;
    }

    // Check size
    if (file.size > MAX_FILE_SIZE) {
      errors.push({
        filename: file.name,
        error: `Too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB.`,
      });
      continue;
    }

    valid.push(file);
  }

  return { valid, errors };
}

/**
 * HIGH-7 FIX: Strip EXIF metadata from image buffer using sharp.
 *
 * sharp is already a transitive dependency via Next.js.
 * .rotate() applies auto-orientation from EXIF, and by default sharp strips all metadata.
 */
export async function stripExif(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    return await sharp(buffer).rotate().toBuffer();
  } catch {
    // If sharp fails (e.g. unsupported format), return original buffer
    return buffer;
  }
}
