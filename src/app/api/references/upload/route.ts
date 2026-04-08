import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { createReference, getSessionReferences } from '@/lib/db/queries';
import { ensureUploadDir } from '@/lib/utils/image';
import {
  validateSessionId,
  validateUploadedFiles,
  stripExif,
} from '@/lib/security';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const sessionId = formData.get('sessionId') as string;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  // CRIT-3: Validate sessionId format (prevent path traversal)
  if (!validateSessionId(sessionId)) {
    return NextResponse.json(
      { error: 'Invalid session ID format' },
      { status: 400 }
    );
  }

  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return NextResponse.json(
      { error: 'No files provided' },
      { status: 400 }
    );
  }

  // HIGH-2: Server-side file validation (type, size, count)
  // P1-5: Pass existing reference count so total limit is enforced
  const existingRefs = getSessionReferences(sessionId);
  const { valid, errors } = validateUploadedFiles(files, existingRefs.length);

  if (valid.length === 0) {
    return NextResponse.json(
      { error: 'No valid files', details: errors },
      { status: 400 }
    );
  }

  const uploadDir = ensureUploadDir(sessionId);
  const results: { id: string; filename: string; path: string }[] = [];

  for (const file of valid) {
    const ext = path.extname(file.name) || '.png';
    const savedName = `${nanoid()}${ext}`;
    const filePath = path.join(uploadDir, savedName);
    const relativePath = `/uploads/${sessionId}/${savedName}`;

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // HIGH-7: Strip EXIF metadata (GPS, device info, timestamps)
    buffer = await stripExif(buffer);

    await writeFile(filePath, buffer);

    const refId = createReference(sessionId, file.name, relativePath);
    results.push({ id: refId, filename: file.name, path: relativePath });
  }

  return NextResponse.json({
    references: results,
    ...(errors.length > 0 && { skipped: errors }),
  });
}
