import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { createReference } from '@/lib/db/queries';
import { ensureUploadDir } from '@/lib/utils/image';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const sessionId = formData.get('sessionId') as string;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
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

  const uploadDir = ensureUploadDir(sessionId);
  const results: { id: string; filename: string; path: string }[] = [];

  for (const file of files) {
    const ext = path.extname(file.name) || '.png';
    const savedName = `${nanoid()}${ext}`;
    const filePath = path.join(uploadDir, savedName);
    const relativePath = `/uploads/${sessionId}/${savedName}`;

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const refId = createReference(sessionId, file.name, relativePath);
    results.push({ id: refId, filename: file.name, path: relativePath });
  }

  return NextResponse.json({ references: results });
}
