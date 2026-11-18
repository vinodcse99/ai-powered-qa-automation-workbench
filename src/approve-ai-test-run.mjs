import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { userInfo } from 'node:os';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertValidRunId,
  getRunPaths,
  getRunHashes
} from './ai-qa-run-integrity.mjs';

const root = process.cwd();

async function approveRun(runId) {
  assertValidRunId(runId);
  const paths = getRunPaths(root, runId);
  const manifest = JSON.parse(await readFile(paths.manifestFile, 'utf8'));
  const quality = JSON.parse(await readFile(paths.qualityReport, 'utf8'));

  if (manifest.runId !== runId || manifest.status !== 'AWAITING_REVIEW') {
    throw new Error('Run is not awaiting review or its manifest is inconsistent.');
  }
  if (quality.status !== 'PASS' || quality.failedChecks !== 0) {
    throw new Error('Approval blocked: the quality report is not a clean PASS.');
  }

  const hashes = await getRunHashes(paths);
  console.log('\nReview this generated automation before approving:');
  console.log(path.relative(root, paths.automationFile));
  console.log('Scenarios:', manifest.scenarioCount);
  console.log('Quality checks:', quality.passedChecks, '/', quality.passedChecks + quality.failedChecks);
  console.log('SHA-256 (spec):', hashes.automation);
  console.log('\nApproval confirms you have reviewed the exact scenario, spec and quality report.');

  const rl = createInterface({ input: stdin, output: stdout });
  let answer;
  try {
    answer = (await rl.question('Type APPROVE to authorize this exact run: ')).trim();
  } finally {
    rl.close();
  }
  if (answer !== 'APPROVE') {
    console.log('Approval not granted. No approval record was created.');
    return;
  }

  const approval = {
    runId,
    decision: 'APPROVED',
    approvedAt: new Date().toISOString(),
    approvedBy: userInfo().username || 'local-user',
    hashes
  };
  await writeFile(paths.approvalFile, JSON.stringify(approval, null, 2), { flag: 'wx' });
  manifest.status = 'APPROVED';
  manifest.approvedAt = approval.approvedAt;
  await writeFile(paths.manifestFile, JSON.stringify(manifest, null, 2));
  console.log('\nAPPROVED. Execution is now available for this run only.');
}

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: npm run ai:approve -- <run-id>');
  process.exitCode = 1;
} else {
  approveRun(runId).catch(error => {
    console.error('APPROVAL FAILED:', error.message);
    process.exitCode = 1;
  });
}
