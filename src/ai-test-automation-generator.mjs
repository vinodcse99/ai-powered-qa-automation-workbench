
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

import {
  readFile,
  writeFile,
  mkdir
} from 'node:fs/promises';

import path from 'node:path';

// --------------------------------------------------
// 1. GEMINI CONFIGURATION
// --------------------------------------------------

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing in .env');
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 60000,
    retryOptions: {
      attempts: 3,
      initialDelay: 1,
      maxDelay: 8,
      expBase: 2,
      jitter: 1
    }
  }
});

// --------------------------------------------------
// 2. PROJECT PATHS
// --------------------------------------------------

const projectRoot = process.cwd();

const inputFile = path.join(
  projectRoot,
  'test-data',
  'generated-search-scenarios.json'
);

const outputDirectory = path.join(
  projectRoot,
  'generated',
  'automation'
);

// --------------------------------------------------
// 3. GEMINI PROMPT
// --------------------------------------------------

function buildPrompt(scenarios, language) {
  return `
You are a senior Playwright TypeScript automation engineer.

TASK:
Convert the supplied manual test scenarios into a complete
Playwright TypeScript test specification.

APPLICATION:
Enterprise Data Catalog demo application.

MANUAL TEST SCENARIOS:
${JSON.stringify(scenarios, null, 2)}

OUTPUT LANGUAGE:
${language}

Write test titles and comments in ${language}.
Keep TypeScript syntax, identifiers, scenario IDs,
Playwright APIs and technical names in English.

VERIFIED PAGE OBJECT MODEL:

File: tests/pages/catalog.page.ts

Class: CatalogPage

Constructor:
new CatalogPage(page)

Verified methods and properties:

1. open()
   Opens the application and verifies its heading.

2. rows
   Locator for asset rows using data-testid="asset-row".

3. searchFor(value: string)
   Fills the Search assets input.
   Results update automatically.

4. filterBy(type: 'All' | 'Table' | 'API' | 'File')
   Selects an asset type.

5. clearFilters()
   Clicks Clear filters.

6. 6. viewAsset(name: string)
   Clicks the View button for the matching asset.

7. expectAssetDetails(name: string, owner: string)
   Verifies that the details section is visible.
   Verifies the asset name and owner.
   Verifies the asset ID and description are populated.

IMPORTANT:
After calling viewAsset(), call expectAssetDetails()
to verify the actual asset details.
Do not treat a successful click as a successful test.

VERIFIED APPLICATION DATA:

- Customer Master | Data Platform | Table
- Sales Transactions | Finance Data | Table
- Product Reference API | Product Engineering | API
- Supplier Data Feed | Procurement Ops | File

VERIFIED APPLICATION BEHAVIOR:

- Search supports partial asset names.
- Search supports partial owner names.
- Search is case-insensitive.
- Search trims leading and trailing whitespace.
- Results update automatically.
- No matches display:
  "No assets match your search."
- Empty state uses role="status".
- Asset rows use data-testid="asset-row".

IMPLEMENTATION REQUIREMENTS:
For asset details scenarios:
- Call catalog.viewAsset() with the verified asset name.
- Call catalog.expectAssetDetails() with the expected asset name and owner.
- Do not create tests that only click View without assertions.

1. Return valid Playwright TypeScript source code only.
2. Import test and expect from '@playwright/test'.
3. Import CatalogPage from '../../tests/pages/catalog.page'.
4. Instantiate CatalogPage using the page fixture.
5. Open the catalog before each independent test.
6. Use only the verified Page Object Model methods.
7. Use meaningful Playwright assertions.
8. Generate one independent test for each supplied scenario.
9. Include the original scenario ID in each test title.
10. Do not invent application features, methods or locators.
11. Do not invent application data or expected behavior.
12. Do not add a Search button.
13. Do not modify the existing Page Object Model.
14. Do not use test.skip.
15. Do not execute generated tests.
16. Do not include Markdown fences or explanations.

If a scenario cannot be automated using the verified
application capabilities, do not invent an implementation.
Return a clear comment identifying that limitation.

QUALITY:
The generated code must compile as TypeScript and use
only verified application capabilities.
`;
}

// --------------------------------------------------
// 4. ERROR DIAGNOSTICS
// --------------------------------------------------

function explainGeminiError(error) {
  const message = error?.message ?? String(error);

  if (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED')
  ) {
    return 'Gemini quota or rate limit reached. Check API quota.';
  }

  if (
    message.includes('503') ||
    message.includes('UNAVAILABLE')
  ) {
    return 'Gemini service is temporarily unavailable.';
  }

  if (
    message.includes('504') ||
    message.includes('DEADLINE_EXCEEDED')
  ) {
    return 'Gemini request timed out. Try again later.';
  }

  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('API_KEY')
  ) {
    return 'Gemini authentication or API permission issue.';
  }

  return message;
}

// --------------------------------------------------
// 5. GENERATED CODE VALIDATION
// --------------------------------------------------

function validateGeneratedCode(code, scenarios) {
  const checks = [
    {
      name: 'Playwright import',
      valid: code.includes("from '@playwright/test'")
    },
    {
      name: 'CatalogPage import',
      valid: code.includes('../../tests/pages/catalog.page')
    },
    {
      name: 'CatalogPage usage',
      valid: code.includes('CatalogPage')
    },
    {
      name: 'Playwright test declarations',
      valid: /test\s*\(/.test(code)
    }
  ];

  for (const scenario of scenarios) {
    checks.push({
      name: `Scenario ID ${scenario.id}`,
      valid: code.includes(scenario.id)
    });
  }

  const failedChecks = checks
    .filter(check => !check.valid)
    .map(check => check.name);

  if (failedChecks.length > 0) {
    throw new Error(
      `Generated code failed validation: ${failedChecks.join(', ')}`
    );
  }

  const testCount = (code.match(/\btest\s*\(/g) || []).length;

  if (testCount !== scenarios.length) {
    throw new Error(
      `Expected ${scenarios.length} tests but generated ${testCount}.`
    );
  }
}

// --------------------------------------------------
// 6. MAIN AUTOMATION GENERATOR
// --------------------------------------------------

export async function generatePlaywrightAutomation(options = {}) {
  try {
    console.log('Starting AI automation generation...');

    let scenarios = options.scenarios;

    // Backward compatibility:
    // Existing generate-automation.mjs can still call this
    // function without arguments.
    if (!scenarios) {
      console.log('Reading existing manual test cases...');

      const jsonContent = await readFile(inputFile, 'utf-8');
      const scenarioData = JSON.parse(jsonContent);

      scenarios = scenarioData.scenarios;
    }

    if (
      !Array.isArray(scenarios) ||
      scenarios.length === 0
    ) {
      throw new Error('No valid test scenarios were supplied.');
    }

    for (const scenario of scenarios) {
      if (
        !scenario.id ||
        !scenario.title ||
        !Array.isArray(scenario.steps) ||
        !scenario.expectedResult
      ) {
        throw new Error(
          'A test scenario is missing required fields.'
        );
      }
    }

    const language = options.language || 'English';

    const fileName = options.outputFileName ||
      'ai-generated-search.spec.ts';

    if (
      path.basename(fileName) !== fileName ||
      !fileName.endsWith('.spec.ts')
    ) {
      throw new Error(
        'Output filename must be a safe .spec.ts filename.'
      );
    }

    const outputFile = path.join(
      outputDirectory,
      fileName
    );

    console.log(`Loaded ${scenarios.length} scenarios.`);
    console.log(`Output language: ${language}`);

    const prompt = buildPrompt(scenarios, language);

    console.log('Sending scenarios to Gemini...');
    console.log('Model: gemini-3.6-flash');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    if (!response.text) {
      throw new Error(
        'Gemini returned an empty automation script.'
      );
    }

    const automationCode = response.text
      .replace(/^```(?:typescript|ts)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    console.log('Gemini generation completed.');
    console.log('Validating generated automation...');

    validateGeneratedCode(automationCode, scenarios);

    await mkdir(outputDirectory, {
      recursive: true
    });

    await writeFile(
      outputFile,
      automationCode,
      {
        encoding: 'utf-8',
        flag: 'wx'
      }
    );

    console.log('Automation generated successfully.');
    console.log('Generated file:', outputFile);
    console.log('Status: Saved for human review.');

    return outputFile;

  } catch (error) {
    console.error(
      'Automation generation failed:',
      explainGeminiError(error)
    );

    throw error;
  }
}
