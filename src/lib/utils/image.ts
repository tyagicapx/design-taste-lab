import fs from 'fs';
import path from 'path';

export function imageToBase64(filePath: string): {
  base64: string;
  mediaType: string;
} {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const buffer = fs.readFileSync(absolutePath);
  const base64 = buffer.toString('base64');

  const ext = path.extname(filePath).toLowerCase();
  const mediaTypeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  const mediaType = mediaTypeMap[ext] || 'image/png';

  return { base64, mediaType };
}

export function ensureUploadDir(sessionId: string): string {
  // CRIT-3: Defense-in-depth path traversal check
  const baseDir = path.join(process.cwd(), 'public', 'uploads');
  const dir = path.resolve(baseDir, sessionId);
  if (!dir.startsWith(baseDir)) {
    throw new Error('Invalid session ID — path traversal detected');
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function ensureProbeDir(sessionId: string): string {
  const dir = path.join(
    process.cwd(),
    'public',
    'uploads',
    sessionId,
    'probes'
  );
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Allowed: PNG, JPG, WebP, GIF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB.`;
  }
  return null;
}
