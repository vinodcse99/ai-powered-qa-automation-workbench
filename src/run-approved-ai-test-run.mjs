import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getRunPaths, assertValidRunId } from './ai-qa-run-integrity.mjs';

const root = process.cwd();

function runCommand(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

async function execute(runId) {
  assertValidRunId(runId);
  const paths = getRunPaths(root, runId);
  const manifest = JSON.parse(await readFile(paths.manifestFile, 'utf8'));
  if (manifest.status !== 'APPROVED') {
    throw new Error('Execution blocked: this run has not been approved.');
  }

  console.log('\n[PRE-EXECUTION] TypeScript project check');
  const typecheckExit = runCommand('npm', ['run', 'typecheck'], process.env);
  if (typecheckExit !== 0) {
    throw new Error(`Execution blocked: TypeScript check failed (exit ${typecheckExit}).`);
  }

  console.log('\n[EXECUTION] Running only the approved generated spec');
  const env = { ...process.env, AI_QA_RUN_ID: runId };
  const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
  const exitCode = runCommand(process.execPath, [cli, 'test', '--config=playwright.generated.config.ts'], env);

  manifest.status = exitCode === 0 ? 'EXECUTED' : 'EXECUTION_FAILED';
  manifest.executedAt = new Date().toISOString();
  manifest.executionExitCode = exitCode;
  await writeFile(paths.manifestFile, JSON.stringify(manifest, null, 2));

  if (exitCode !== 0) process.exitCode = exitCode;
  else console.log('\nApproved run completed successfully:', runId);
}

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: npm run ai:execute -- <run-id>');
  process.exitCode = 1;
} else {
  execute(runId).catch(error => {
    console.error('AI TEST EXECUTION BLOCKED/FAILED:', error.message);
    process.exitCode = 1;
  });
}
