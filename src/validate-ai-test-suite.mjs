import { readFile } from 'node:fs/promises';
import {
  assertValidRunId,
  getRunPaths,
  getRunHashes
} from './ai-qa-run-integrity.mjs';

const root = process.cwd();

export default async function globalSetup() {
  const runId = process.env.AI_QA_RUN_ID;
  assertValidRunId(runId);
  const paths = getRunPaths(root, runId);

  const [manifest, approval, quality] = await Promise.all([
    readFile(paths.manifestFile, 'utf8').then(JSON.parse),
    readFile(paths.approvalFile, 'utf8').then(JSON.parse),
    readFile(paths.qualityReport, 'utf8').then(JSON.parse)
  ]);

  if (manifest.runId !== runId || manifest.status !== 'APPROVED') {
    throw new Error('AI Quality Gate: selected run is not approved.');
  }
  if (approval.runId !== runId || approval.decision !== 'APPROVED') {
    throw new Error('AI Quality Gate: valid approval record not found.');
  }
  if (quality.status !== 'PASS' || quality.failedChecks !== 0) {
    throw new Error('AI Quality Gate: stored quality report is not PASS.');
  }

  const currentHashes = await getRunHashes(paths);
  for (const key of ['scenarios', 'automation', 'qualityReport']) {
    if (currentHashes[key] !== approval.hashes?.[key]) {
      throw new Error(`AI Quality Gate: ${key} changed after approval. Review and approve again.`);
    }
  }

  console.log('\nAI Quality Gate: approval and SHA-256 integrity verified.');
  console.log('Selected run:', runId);
  console.log('Only this run will be collected by Playwright.');
}
