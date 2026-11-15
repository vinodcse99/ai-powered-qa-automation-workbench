
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateTestScenarios } from './ai-test-designer.mjs';

// Get the project root directory
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, '..');

// Define the output folder and file
const outputDirectory = path.join(projectRoot, 'test-data');
const outputFile = path.join(
  outputDirectory,
  'generated-search-scenarios.json'
);

const requirement = `
As a data catalog user, I want to search assets
by name or owner so that I can quickly find
the required data asset.
`;

try {
  console.log('Generating test scenarios...');

  const result = await generateTestScenarios(requirement);

  // Create the folder if it does not exist
  await mkdir(outputDirectory, { recursive: true });

  // Save generated scenarios
  await writeFile(
    outputFile,
    JSON.stringify(result, null, 2),
    'utf-8'
  );

  console.log('Test scenarios saved successfully.');
  console.log('File location:', outputFile);

} catch (error) {
  console.error('Generation failed:', error.message);
  process.exitCode = 1;
}
