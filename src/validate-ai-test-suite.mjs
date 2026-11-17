import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  validateGeneratedAutomation
} from './ai-test-quality-gate.mjs';

const root = process.cwd();

export default async function globalSetup() {
  const automationDirectory = path.join(
    root, 'generated', 'automation'
  );

  const runsDirectory = path.join(
    root, 'generated', 'runs'
  );

  const files = await readdir(automationDirectory);

  const generatedSpecs = files.filter(file =>
    /^ai-generated-\d{4}-\d{2}-\d{2}T.*\.spec\.ts$/.test(file)
  );

  if (generatedSpecs.length === 0) {
    throw new Error(
      'AI Quality Gate: No timestamped generated test specifications found.'
    );
  }

  console.log('\nValidating generated Playwright suites...');

  for (const file of generatedSpecs) {
    const runId = file.slice(
      'ai-generated-'.length,
      -'.spec.ts'.length
    );

    const runDirectory = path.join(runsDirectory, runId);
    const scenarioFile = path.join(runDirectory, 'scenarios.json');

    const scenarioData = JSON.parse(
      await readFile(scenarioFile, 'utf-8')
    );

    if (!Array.isArray(scenarioData.scenarios)) {
      throw new Error(`Invalid scenarios file for run ${runId}.`);
    }

    await validateGeneratedAutomation({
      scenarios: scenarioData.scenarios,
      automationFile: path.join(automationDirectory, file),
      reportFile: path.join(runDirectory, 'quality-report.json')
    });
  }

  console.log('\nAI Quality Gate: All generated suites passed.');
}
