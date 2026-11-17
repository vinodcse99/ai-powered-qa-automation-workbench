
import {
  mkdir,
  rename,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';

import { generateTestScenarios } from './ai-test-designer.mjs';
import { generatePlaywrightAutomation } from './ai-test-automation-generator.mjs';
import { validateGeneratedAutomation } from './ai-test-quality-gate.mjs';

const projectRoot = process.cwd();

const runsDirectory = path.join(
  projectRoot,
  'generated',
  'runs'
);

const rejectedDirectory = path.join(
  projectRoot,
  'generated',
  'rejected'
);

function parseArguments(args) {
  let language = 'English';
  const requirementParts = [];

  for (let i = 0; i < args.length; i++) {
    const argument = args[i];

    if (argument.startsWith('--language=')) {
      language = argument.substring('--language='.length).trim();
      continue;
    }

    if (argument === '--language') {
      const next = args[i + 1];

      if (!next || next.startsWith('--')) {
        throw new Error('Please provide a language after --language.');
      }

      language = next.trim();
      i++;
      continue;
    }

    requirementParts.push(argument);
  }

  return {
    language,
    requirement: requirementParts.join(' ').trim()
  };
}

function createRunId() {
  return new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-');
}

async function runWorkflow() {
  console.log('\n======================================');
  console.log(' AI-POWERED QA AUTOMATION WORKBENCH');
  console.log('======================================');

  const { requirement, language } =
    parseArguments(process.argv.slice(2));

  if (!requirement || requirement.length < 10) {
    throw new Error(
      'Provide a requirement containing at least 10 characters.'
    );
  }

  if (!language) {
    throw new Error('Output language cannot be empty.');
  }

  const runId = createRunId();
  const runDirectory = path.join(runsDirectory, runId);
  const scenarioFile = path.join(runDirectory, 'scenarios.json');
  const qualityReport = path.join(runDirectory, 'quality-report.json');
  const automationFileName = `ai-generated-${runId}.spec.ts`;

  await mkdir(runDirectory, { recursive: true });

  console.log('\nRun ID:', runId);
  console.log('Language:', language);
  console.log('Requirement:', requirement);

  // STAGE 1: AI TEST DESIGN
  console.log('\n[STAGE 1] AI TEST DESIGN');

  const scenarioData = await generateTestScenarios(
    requirement,
    language
  );

  if (
    !scenarioData ||
    !Array.isArray(scenarioData.scenarios) ||
    scenarioData.scenarios.length === 0
  ) {
    throw new Error('AI Test Designer returned no valid scenarios.');
  }

  await writeFile(
    scenarioFile,
    JSON.stringify(scenarioData, null, 2),
    { encoding: 'utf-8', flag: 'wx' }
  );

  console.log('Scenarios generated:', scenarioData.scenarios.length);

  // STAGE 2: AI AUTOMATION GENERATION
  console.log('\n[STAGE 2] AI AUTOMATION GENERATION');

  const automationFile = await generatePlaywrightAutomation({
    scenarios: scenarioData.scenarios,
    language,
    outputFileName: automationFileName
  });

  // STAGE 3: AI TEST QUALITY GATE
  console.log('\n[STAGE 3] AI TEST QUALITY GATE');

  let qualityResult;

  try {
    qualityResult = await validateGeneratedAutomation({
      scenarios: scenarioData.scenarios,
      automationFile,
      reportFile: qualityReport
    });
  } catch (error) {
    await mkdir(rejectedDirectory, { recursive: true });

    const rejectedFile = path.join(
      rejectedDirectory,
      path.basename(automationFile)
    );

    await rename(automationFile, rejectedFile);

    console.error('\nGenerated automation was rejected by the quality gate.');
    console.error('Rejected spec preserved at:', rejectedFile);
    console.error('Quality report preserved at:', qualityReport);

    throw error;
  }

  // FINAL SUMMARY
  console.log('\n======================================');
  console.log(' WORKFLOW COMPLETED');
  console.log('======================================');

  console.log('Run ID:', runId);
  console.log('Language:', language);
  console.log('Scenarios:', scenarioData.scenarios.length);
  console.log('Automation:', automationFile);
  console.log('Quality status:', qualityResult.status);
  console.log('Quality report:', qualityReport);

  console.log('\nSTATUS: Generated and quality-validated.');
  console.log('EXECUTION: Awaiting your approval.');
}

try {
  await runWorkflow();
} catch (error) {
  console.error('\nWORKFLOW FAILED');
  console.error(error.message);
  process.exitCode = 1;
}
