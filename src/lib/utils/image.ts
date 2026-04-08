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
  const baseDir = path.join(process.cwd(), 'public', 'uploads');
  const dir = path.resolve(baseDir, sessionId, 'probes');
  if (!dir.startsWith(baseDir)) {
    throw new Error('Invalid session ID — path traversal detected');
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

