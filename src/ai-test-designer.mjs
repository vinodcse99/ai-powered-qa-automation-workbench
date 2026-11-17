
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    'GEMINI_API_KEY is missing. Check your .env file.'
  );
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

const testCaseSchema = {
  type: 'object',
  properties: {
    scenarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          category: {
            type: 'string',
            enum: ['Positive', 'Negative', 'Boundary', 'Edge']
          },
          priority: {
            type: 'string',
            enum: ['Critical', 'High', 'Medium', 'Low']
          },
          preconditions: {
            type: 'array',
            items: { type: 'string' }
          },
          steps: {
            type: 'array',
            items: { type: 'string' }
          },
          expectedResult: { type: 'string' }
        },
        required: [
          'id',
          'title',
          'category',
          'priority',
          'preconditions',
          'steps',
          'expectedResult'
        ]
      }
    }
  },
  required: ['scenarios']
};

// Generate structured test scenarios.
export async function generateTestScenarios(
  requirement,
  language = 'English'
) {
  if (
    typeof requirement !== 'string' ||
    requirement.trim().length < 10
  ) {
    throw new Error(
      'Please provide a requirement with at least 10 characters.'
    );
  }

  if (
    typeof language !== 'string' ||
    !language.trim()
  ) {
    throw new Error(
      'Please provide a valid output language.'
    );
  }

  const supportedFeatures = `
APPLICATION:
Enterprise Data Catalog demo application.

SUPPORTED FEATURES:
1. Search assets by partial asset name.
2. Search assets by partial owner name.
3. Case-insensitive search.
4. Search with leading and trailing whitespace.
5. Filter assets by All, Table, API and File.
6. Clear active filters.
7. View an asset.

VERIFIED DATA:
- Customer Master | Data Platform | Table
- Sales Transactions | Finance Data | Table
- Product Reference API | Product Engineering | API
- Supplier Data Feed | Procurement Ops | File

IMPORTANT:
Generate scenarios only for the supported application features.
Do not invent login, permissions, database editing, deletion,
upload, export or other unsupported functionality.
`;

  const prompt = `
You are a senior QA automation architect.

Analyze the following business requirement:

${requirement.trim()}

${supportedFeatures}

OUTPUT LANGUAGE:
${language.trim()}

Write scenario titles, preconditions, test steps and expected
results in ${language.trim()}.

Keep scenario IDs and category/priority enum values in English.
Keep technical identifiers and product names unchanged.

Generate practical test scenarios covering:
1. Positive scenarios
2. Negative scenarios
3. Boundary conditions
4. Edge cases

Each scenario must include:
- Unique scenario ID
- Clear title
- Category
- Priority
- Preconditions
- Practical test steps
- Expected result

Do not invent unsupported application behavior.
Return only data matching the supplied JSON schema.
`;

  try {
    console.log('Sending requirement to Gemini AI...');
    console.log(`Requested language: ${language}`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: testCaseSchema
      }
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response.');
    }

    const result = JSON.parse(response.text);

    if (
      !result ||
      !Array.isArray(result.scenarios) ||
      result.scenarios.length === 0
    ) {
      throw new Error('Invalid test scenario response.');
    }

    console.log(
      `Successfully generated ${result.scenarios.length} scenarios.`
    );

    return result;

  } catch (error) {
    console.error(
      'AI Test Generation Failed:',
      error.message
    );

    if (error.status === 504) {
      throw new Error('Gemini API timeout. Please retry later.');
    }

    if (error.status === 503) {
      throw new Error('Gemini service is busy. Please retry later.');
    }

    if (error.status === 429) {
      throw new Error('Gemini API rate limit reached.');
    }

    if (error.status === 401 || error.status === 403) {
      throw new Error(
        'Gemini authentication or permission error. Check your API key.'
      );
    }

    throw error;
  }
}
