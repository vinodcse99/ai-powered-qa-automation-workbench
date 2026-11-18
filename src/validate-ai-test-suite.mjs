import { verifyRunApproval } from './ai-qa-run-integrity.mjs';

const root = process.cwd();

export default async function globalSetup() {
  const runId = process.env.AI_QA_RUN_ID;
  const verified = await verifyRunApproval(root, runId);

  console.log('\nAI Quality Gate: approval and SHA-256 integrity verified.');
  console.log('Selected run:', runId);
  console.log('Approved scenarios:', verified.manifest.scenarioCount);
  console.log('Quality checks:', verified.quality.passedChecks, '/', verified.quality.passedChecks + verified.quality.failedChecks);
  console.log('Only this run will be collected by Playwright.');
}
