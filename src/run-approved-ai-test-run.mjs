import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getRunPaths, assertValidRunId } from './ai-qa-run-integrity.mjs';

const root = process.cwd();

async function execute(runId) {
  assertValidRunId(runId);
  const paths = getRunPaths(root, runId);
  const manifest = JSON.parse(await readFile(paths.manifestFile, 'utf8'));
  if (manifest.status !== 'APPROVED') {
    throw new Error('Execution blocked: this run has not been approved.');
  }

  const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
  const result = spawnSync(process.execPath, [
    cli, 'test', '--config=playwright.generated.config.ts'
  ], {
    cwd: root,
    env: { ...process.env, AI_QA_RUN_ID: runId },
    stdio: 'inherit'
  });

  const exitCode = result.status ?? 1;
  manifest.status = exitCode === 0 ? 'EXECUTED' : 'EXECUTION_FAILED';
  manifest.executedAt = new Date().toISOString();
  manifest.executionExitCode = exitCode;
  await writeFile(paths.manifestFile, JSON.stringify(manifest, null, 2));

  if (result.error) throw result.error;
  if (exitCode !== 0) process.exitCode = exitCode;
  else console.log('\nApproved run completed successfully:', runId);
}

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: npm run test:ai -- <run-id>');
  process.exitCode = 1;
} else {
  execute(runId).catch(error => {
    console.error('AI TEST EXECUTION BLOCKED/FAILED:', error.message);
    process.exitCode = 1;
  });
}
