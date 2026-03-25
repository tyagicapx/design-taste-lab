import { NextRequest, NextResponse } from 'next/server';
import { updateReferenceAnnotations, updateReferenceClassification } from '@/lib/db/queries';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Handle annotations update
  if (body.annotations) {
    updateReferenceAnnotations(id, body.annotations);
  }

  // V2: Handle classification updates (weight, role, surfaceType, clusterId)
  if (body.weight !== undefined || body.role !== undefined || body.surfaceType !== undefined || body.clusterId !== undefined) {
    updateReferenceClassification(id, {
      ...(body.weight !== undefined && { weight: body.weight }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.surfaceType !== undefined && { surfaceType: body.surfaceType }),
      ...(body.clusterId !== undefined && { clusterId: body.clusterId }),
    });
  }

  return NextResponse.json({ success: true });
}
