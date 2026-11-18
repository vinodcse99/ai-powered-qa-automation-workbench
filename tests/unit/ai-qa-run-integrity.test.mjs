import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  assertValidRunId,
  getRunPaths,
  getRunHashes,
  verifyRunApproval
} from '../../src/ai-qa-run-integrity.mjs';

const runId = '2026-11-18T03-38-50-123Z';

async function createApprovedFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ai-qa-approval-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const paths = getRunPaths(root, runId);
  await mkdir(paths.runDirectory, { recursive: true });
  await mkdir(path.dirname(paths.automationFile), { recursive: true });

  await writeFile(paths.scenarioFile, JSON.stringify({ scenarios: [{ id: 'TC-001' }] }));
  await writeFile(paths.automationFile, "import { test, expect } from '@playwright/test';\\ntest('TC-001', async () => { expect(1).toBe(1); });\\n");
  await writeFile(paths.qualityReport, JSON.stringify({ status: 'PASS', passedChecks: 10, failedChecks: 0 }));

  const manifest = {
    runId,
    status: 'APPROVED',
    automationFile: path.relative(root, paths.automationFile),
    scenarioCount: 1
  };
  await writeFile(paths.manifestFile, JSON.stringify(manifest));

  const hashes = await getRunHashes(paths);
  await writeFile(paths.approvalFile, JSON.stringify({
    runId,
    decision: 'APPROVED',
    approvedAt: new Date().toISOString(),
    approvedBy: 'unit-test',
    hashes
  }));
  return { root, paths };
}

test('accepts the generated timestamp run ID format', () => {
  assert.equal(assertValidRunId(runId), runId);
});

test('rejects malformed run IDs before constructing paths', () => {
  assert.throws(() => assertValidRunId('../latest'), /Invalid run ID/);
  assert.throws(() => assertValidRunId('2026-11-18'), /Invalid run ID/);
});

test('accepts an approved run when all three approved files are unchanged', async t => {
  const { root } = await createApprovedFixture(t);
  const result = await verifyRunApproval(root, runId);
  assert.equal(result.manifest.status, 'APPROVED');
  assert.equal(result.quality.status, 'PASS');
});

for (const [label, fileKey] of [
  ['scenario file', 'scenarioFile'],
  ['generated automation file', 'automationFile'],
  ['quality report', 'qualityReport']
]) {
  test(\`rejects a modified \${label} after approval\`, async t => {
    const { root, paths } = await createApprovedFixture(t);
    await writeFile(paths[fileKey], 'tampered after approval');
    await assert.rejects(
      verifyRunApproval(root, runId),
      /changed after approval/
    );
  });
}

test('rejects a run whose manifest is not approved', async t => {
  const { root, paths } = await createApprovedFixture(t);
  const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(paths.manifestFile, 'utf8'));
  manifest.status = 'AWAITING_REVIEW';
  await writeFile(paths.manifestFile, JSON.stringify(manifest));
  await assert.rejects(verifyRunApproval(root, runId), /not approved/);
});

test('rejects a manifest pointing to a different generated spec', async t => {
  const { root, paths } = await createApprovedFixture(t);
  const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(paths.manifestFile, 'utf8'));
  manifest.automationFile = 'generated/automation/another-run.spec.ts';
  await writeFile(paths.manifestFile, JSON.stringify(manifest));
  await assert.rejects(verifyRunApproval(root, runId), /path does not match/);
});
