
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

const outputFile = path.join(
  outputDirectory,
  'ai-generated-search.spec.ts'
);

// --------------------------------------------------
// 3. GEMINI PROMPT
// --------------------------------------------------

function buildPrompt(scenarios) {
  return `
You are a senior Playwright TypeScript automation engineer.

TASK:
Convert the supplied manual test scenarios into a complete
Playwright TypeScript test specification.

PROJECT APPLICATION:
Enterprise Data Catalog demo application.

MANUAL TEST SCENARIOS:
${JSON.stringify(scenarios, null, 2)}

EXISTING PAGE OBJECT MODEL:

File: tests/pages/catalog.page.ts

Class: CatalogPage

Constructor:
new CatalogPage(page)

Verified methods and properties:

1. open()
   Navigates to the application and verifies its heading.

2. rows
   Locator for asset rows using data-testid="asset-row".

3. searchFor(value: string)
   Fills the Search assets input.
   Search results update automatically on input.
   There is NO Search button.

4. filterBy(type: 'All' | 'Table' | 'API' | 'File')
   Selects an asset type.

5. clearFilters()
   Clicks Clear filters.

6. viewAsset(name: string)
   Clicks the View button for the matching asset.

IMPORTANT:
Do not invent additional CatalogPage methods.
Do not assume that viewAsset() returns asset details.

VERIFIED APPLICATION DATA:

1. Customer Master
   Owner: Data Platform
   Type: Table

2. Sales Transactions
   Owner: Finance Data
   Type: Table

3. Product Reference API
   Owner: Product Engineering
   Type: API

4. Supplier Data Feed
   Owner: Procurement Ops
   Type: File

VERIFIED APPLICATION BEHAVIOR:

- Search matches partial asset names.
- Search matches partial owner names.
- Search is case-insensitive.
- Search trims leading and trailing whitespace.
- Search results update on the input event.
- Search with no matches displays:
  "No assets match your search."
- The empty-state element has role="status".
- Asset rows have data-testid="asset-row".
- All four asset names contain the letter A, ignoring case.

IMPLEMENTATION REQUIREMENTS:

1. Generate a complete Playwright TypeScript spec.
2. Import test and expect from '@playwright/test'.
3. Import CatalogPage from '../../tests/pages/catalog.page'.
4. Instantiate CatalogPage using the Playwright page fixture.
5. Use catalog.open() before each independent scenario.
6. Use catalog.searchFor() for search operations.
7. Use catalog.rows for row assertions.
8. Use meaningful Playwright expect assertions.
9. Verify exact row counts where the expected result is known.
10. Verify matching row text where appropriate.
11. For no-results scenarios, verify zero rows and the
    role="status" message.
12. For the long-query scenario, generate a 255-character
    non-matching query using JavaScript string repetition.
13. Use scenario IDs in test titles.
14. Do not click a Search button.
15. Do not invent locators, methods, data or behavior.
16. Do not modify the existing Page Object Model.
17. Do not import or execute the generated spec from another test.
18. Generate all eight scenarios as independent tests.
19. Do not use test.skip for these eight supported scenarios.
20. Return only valid TypeScript source code.
21. Do not include Markdown fences or explanations.

OUTPUT LOCATION:
generated/automation/ai-generated-search.spec.ts

RELATIVE IMPORT:
../../tests/pages/catalog.page

QUALITY RULE:
The generated code must use only verified application behavior
and existing Page Object Model capabilities.
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
    return 'Gemini quota or rate limit reached. Check API quota and retry later.';
  }

  if (
    message.includes('503') ||
    message.includes('UNAVAILABLE')
  ) {
    return 'Gemini service is temporarily unavailable or overloaded. Retry later.';
  }

  if (
    message.includes('504') ||
    message.includes('DEADLINE_EXCEEDED')
  ) {
    return 'Gemini request exceeded the upstream service deadline. The generation may need a smaller prompt or another attempt later.';
  }

  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('API_KEY')
  ) {
    return 'Gemini authentication or API permission issue. Verify the API key and project access.';
  }

  return message;
}

// --------------------------------------------------
// 5. GENERATED CODE VALIDATION
// --------------------------------------------------

function validateGeneratedCode(code) {
  const requiredChecks = [
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
    },
    {
      name: 'All eight scenario IDs',
      valid: Array.from(
        { length: 8 },
        (_, index) =>
          `TC-SEARCH-${String(index + 1).padStart(2, '0')}`
      ).every(id => code.includes(id))
    }
  ];

  const failedChecks = requiredChecks
    .filter(check => !check.valid)
    .map(check => check.name);

  if (failedChecks.length > 0) {
    throw new Error(
      `Generated code failed validation: ${failedChecks.join(', ')}`
    );
  }
}

// --------------------------------------------------
// 6. MAIN AUTOMATION GENERATOR
// --------------------------------------------------

export async function generatePlaywrightAutomation() {
  try {
    console.log('Starting AI automation generation...');

    // Read manual test scenarios
    console.log('Reading manual test cases...');

    const jsonContent = await readFile(
      inputFile,
      'utf-8'
    );

    const scenarioData = JSON.parse(jsonContent);

    if (
      !Array.isArray(scenarioData.scenarios) ||
      scenarioData.scenarios.length !== 8
    ) {
      throw new Error(
        'Invalid scenario input. Expected exactly eight scenarios.'
      );
    }

    console.log(
      `Successfully loaded ${scenarioData.scenarios.length} scenarios.`
    );

    // Build Gemini prompt
    const prompt = buildPrompt(
      scenarioData.scenarios
    );

    console.log('Sending scenarios to Gemini...');
    console.log('Model: gemini-3.8-flash');

    // Generate automation code
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    if (!response.text) {
      throw new Error(
        'Gemini returned an empty automation script.'
      );
    }

    // Remove Markdown code fences
    const automationCode = response.text
      .replace(/^```(?:typescript|ts)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    console.log('Gemini generation completed.');

    // Validate generated code
    console.log('Validating generated automation code...');

    validateGeneratedCode(automationCode);

    // Create output directory
    await mkdir(outputDirectory, {
      recursive: true
    });

    // Save generated code outside tests folder
    await writeFile(
      outputFile,
      automationCode,
      'utf-8'
    );

    console.log('Automation code generated successfully!');
    console.log('Generated file:', outputFile);
    console.log('Status: Saved for human review.');

    return outputFile;

  } catch (error) {
    const diagnostic = explainGeminiError(error);

    console.error(
      'Automation generation failed:',
      diagnostic
    );

    throw error;
  }
}
