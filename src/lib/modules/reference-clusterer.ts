import type { SurfaceType, ClusteringResult } from '../types';
import { textProvider } from '../ai/registry';
import { trackApiCall } from '../ai/token-tracker';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/reference-clustering';
import {
  getSession,
  getSessionReferences,
  updateSessionClusters,
  updateReferenceClassification,
} from '../db/queries';
import { parseJsonResponse } from '../utils/json';
import { DEFAULT_CLAUDE_MODEL } from '../constants';


/**
 * Clusters all references into aesthetic families, identifies anchors/outliers,
 * and maps contradictions between clusters.
 * Runs after surface classification, before taste decomposition.
 */
export async function clusterReferences(sessionId: string): Promise<ClusteringResult> {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const refs = getSessionReferences(sessionId);
  const refsWithAnalysis = refs.filter((r) => r.analysis);

  if (refsWithAnalysis.length < 2) {
    // Not enough references to cluster meaningfully
    const singleCluster: ClusteringResult = {
      clusters: [{
        id: 'cluster_1',
        name: 'Primary Direction',
        description: 'Single reference — no clustering possible',
        memberRefIds: refsWithAnalysis.map((r) => r.id),
        dominanceScore: 1.0,
        surfaceTypes: refsWithAnalysis.map((r) => ((r.surfaceType || 'unknown') as SurfaceType)),
      }],
      outlierRefIds: [],
      contradictions: [],
    };
    updateSessionClusters(sessionId, singleCluster);
    return singleCluster;
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    refsWithAnalysis.map((r) => ({
      id: r.id,
      filename: r.filename,
      analysis: r.analysis,
      annotations: r.annotations,
      surfaceType: (r.surfaceType as string) || 'unknown',
      source: (r.source as string) || 'screenshot',
    })),
    session.onboardingData
  );

  const result = await trackApiCall(
    sessionId,
    'reference_clusterer',
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
    clusters: ClusteringResult['clusters'];
    anchorRefIds: string[];
    peripheralRefIds: string[];
    outlierRefIds: string[];
    outlierReasons: Record<string, string>;
    contradictions: ClusteringResult['contradictions'];
  };

  const clusteringResult: ClusteringResult = {
    clusters: parsed.clusters,
    outlierRefIds: parsed.outlierRefIds || [],
    contradictions: parsed.contradictions || [],
  };

  // Save clustering result on session
  updateSessionClusters(sessionId, clusteringResult);

  // Update individual reference roles and cluster assignments
  for (const cluster of parsed.clusters) {
    for (const refId of cluster.memberRefIds) {
      const isAnchor = parsed.anchorRefIds?.includes(refId);
      const isPeripheral = parsed.peripheralRefIds?.includes(refId);
      updateReferenceClassification(refId, {
        role: isAnchor ? 'anchor' : isPeripheral ? 'peripheral' : 'unclassified',
        clusterId: cluster.id,
      });
    }
  }

  // Mark outliers
  for (const refId of parsed.outlierRefIds || []) {
    updateReferenceClassification(refId, {
      role: 'outlier',
      weight: 0.3, // De-weight outliers by default
    });
  }

  return clusteringResult;
}
