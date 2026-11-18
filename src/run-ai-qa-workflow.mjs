import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateTestScenarios } from './ai-test-designer.mjs';
import { generatePlaywrightAutomation } from './ai-test-automation-generator.mjs';
import { validateGeneratedAutomation } from './ai-test-quality-gate.mjs';
import { getRunPaths } from './ai-qa-run-integrity.mjs';

const projectRoot = process.cwd();
const rejectedDirectory = path.join(projectRoot, 'generated', 'rejected');

function parseArguments(args) {
  let language = 'English';
  const requirementParts = [];
  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    if (argument.startsWith('--language=')) {
      language = argument.substring('--language='.length).trim();
    } else if (argument === '--language') {
      const next = args[++i];
      if (!next || next.startsWith('--')) throw new Error('Please provide a language after --language.');
      language = next.trim();
    } else {
      requirementParts.push(argument);
    }
  }
  return { language, requirement: requirementParts.join(' ').trim() };
}

function createRunId() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
}

function validateScenarioData(data) {
  if (!data || !Array.isArray(data.scenarios) || data.scenarios.length === 0) {
    throw new Error('AI Test Designer returned no scenarios.');
  }
  const ids = new Set();
  for (const [index, scenario] of data.scenarios.entries()) {
    const label = `Scenario #${index + 1}`;
    if (!scenario || typeof scenario !== 'object') throw new Error(`${label} must be an object.`);
    if (typeof scenario.id !== 'string' || !/^TC(?:-[A-Z0-9]+)?-\d{2,}$|^TC\d{3,}$/.test(scenario.id)) {
      throw new Error(`${label} has an invalid scenario ID.`);
    }
    if (ids.has(scenario.id)) throw new Error(`Duplicate scenario ID: ${scenario.id}`);
    ids.add(scenario.id);
    if (typeof scenario.title !== 'string' || !scenario.title.trim()) throw new Error(`${scenario.id}: title is required.`);
    if (!['Positive', 'Negative', 'Boundary', 'Edge'].includes(scenario.category)) throw new Error(`${scenario.id}: invalid category.`);
    if (!['Critical', 'High', 'Medium', 'Low'].includes(scenario.priority)) throw new Error(`${scenario.id}: invalid priority.`);
    if (!Array.isArray(scenario.preconditions) || !scenario.preconditions.every(x => typeof x === 'string')) throw new Error(`${scenario.id}: preconditions must be strings.`);
    if (!Array.isArray(scenario.steps) || scenario.steps.length === 0 || !scenario.steps.every(x => typeof x === 'string' && x.trim())) throw new Error(`${scenario.id}: steps must be non-empty strings.`);
    if (typeof scenario.expectedResult !== 'string' || !scenario.expectedResult.trim()) throw new Error(`${scenario.id}: expectedResult is required.`);
  }
}

async function runWorkflow() {
  console.log('\n======================================');
  console.log(' AI-POWERED QA AUTOMATION WORKBENCH');
  console.log('======================================');

  const { requirement, language } = parseArguments(process.argv.slice(2));
  if (!requirement || requirement.length < 10) throw new Error('Provide a requirement containing at least 10 characters.');
  if (!language) throw new Error('Output language cannot be empty.');

  const runId = createRunId();
  const paths = getRunPaths(projectRoot, runId);
  await mkdir(paths.runDirectory, { recursive: false });
  const manifest = {
    schemaVersion: 1,
    runId,
    createdAt: new Date().toISOString(),
    language,
    requirement,
    status: 'GENERATING'
  };
  await writeFile(paths.manifestFile, JSON.stringify(manifest, null, 2), { flag: 'wx' });

  console.log('\nRun ID:', runId);
  console.log('Language:', language);

  try {
    console.log('\n[STAGE 1] AI TEST DESIGN');
    const scenarioData = await generateTestScenarios(requirement, language);
    validateScenarioData(scenarioData);
    await writeFile(paths.scenarioFile, JSON.stringify(scenarioData, null, 2), { flag: 'wx' });
    manifest.scenarioCount = scenarioData.scenarios.length;

    console.log('\n[STAGE 2] AI AUTOMATION GENERATION');
    const automationFile = await generatePlaywrightAutomation({
      scenarios: scenarioData.scenarios,
      language,
      outputFileName: `ai-generated-${runId}.spec.ts`
    });

    console.log('\n[STAGE 3] AI TEST QUALITY GATE');
    const qualityResult = await validateGeneratedAutomation({
      scenarios: scenarioData.scenarios,
      automationFile,
      reportFile: paths.qualityReport
    });

    manifest.status = 'AWAITING_REVIEW';
    manifest.qualityStatus = qualityResult.status;
    manifest.qualityChecks = { passed: qualityResult.passedChecks, failed: qualityResult.failedChecks };
    manifest.automationFile = path.relative(projectRoot, automationFile);
    manifest.updatedAt = new Date().toISOString();
    await writeFile(paths.manifestFile, JSON.stringify(manifest, null, 2));

    console.log('\nWORKFLOW COMPLETED — NOT YET APPROVED');
    console.log('Run ID:', runId);
    console.log('Scenarios:', manifest.scenarioCount);
    console.log('Quality:', qualityResult.status);
    console.log('\nNext: npm run ai:approve --', runId);
    console.log('After review and approval: npm run ai:execute --', runId);
  } catch (error) {
    manifest.status = 'REJECTED';
    manifest.failureReason = error.message;
    manifest.updatedAt = new Date().toISOString();
    await writeFile(paths.manifestFile, JSON.stringify(manifest, null, 2));
    console.error('\nWORKFLOW FAILED:', error.message);
    throw error;
  }
}

runWorkflow().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
