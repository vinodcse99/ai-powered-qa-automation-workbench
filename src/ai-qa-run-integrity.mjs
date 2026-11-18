import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const RUN_ID_PATTERN = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z$/;

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
    automationFile: path.join(root, 'generated', 'automation', `ai-generated-${runId}.spec.ts`)
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
