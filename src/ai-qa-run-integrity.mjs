import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const RUN_ID_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;

export function assertValidRunId(runId) {
  if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) {
    throw new Error('Invalid run ID. Supply the complete timestamped run ID.');
  }
  return runId;
}

export function getRunPaths(root, runId) {
  assertValidRunId(runId);
  const runDirectory = path.join(root, 'generated', 'runs', runId);
  return {
    runDirectory,
    scenarioFile: path.join(runDirectory, 'scenarios.json'),
    qualityReport: path.join(runDirectory, 'quality-report.json'),
    manifestFile: path.join(runDirectory, 'run-manifest.json'),
    approvalFile: path.join(runDirectory, 'approval.json'),
    automationFile: path.join(root, 'generated', 'automation', \`ai-generated-\${runId}.spec.ts\`)
  };
}

export async function sha256File(filePath) {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export async function getRunHashes(paths) {
  return {
    scenarios: await sha256File(paths.scenarioFile),
    automation: await sha256File(paths.automationFile),
    qualityReport: await sha256File(paths.qualityReport)
  };
}

export async function verifyRunApproval(root, runId) {
  const paths = getRunPaths(root, runId);
  const [manifest, approval, quality] = await Promise.all([
    readFile(paths.manifestFile, 'utf8').then(JSON.parse),
    readFile(paths.approvalFile, 'utf8').then(JSON.parse),
    readFile(paths.qualityReport, 'utf8').then(JSON.parse)
  ]);

  if (manifest.runId !== runId || manifest.status !== 'APPROVED') {
    throw new Error('Selected run is not approved or its manifest is inconsistent.');
  }
  if (path.resolve(root, manifest.automationFile ?? '') !== paths.automationFile) {
    throw new Error('Manifest automation path does not match the selected run.');
  }
  if (approval.runId !== runId || approval.decision !== 'APPROVED') {
    throw new Error('Valid approval record not found for this run.');
  }
  if (quality.status !== 'PASS' || quality.failedChecks !== 0) {
    throw new Error('Stored quality report is not a clean PASS.');
  }

  const currentHashes = await getRunHashes(paths);
  for (const key of ['scenarios', 'automation', 'qualityReport']) {
    if (currentHashes[key] !== approval.hashes?.[key]) {
      throw new Error(\`\${key} changed after approval. Review and approve again.\`);
    }
  }

  return { paths, manifest, approval, quality, hashes: currentHashes };
}
