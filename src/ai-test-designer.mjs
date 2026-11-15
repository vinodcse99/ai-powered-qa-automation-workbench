
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// 1. Read Gemini API key from .env
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    'GEMINI_API_KEY is missing. Check your .env file.'
  );
}

// 2. Initialize Gemini AI with timeout and retry configuration
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

// 3. Define the expected JSON structure
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

// 4. Generate test scenarios using Gemini AI
export async function generateTestScenarios(requirement) {

  // Validate the input requirement
  if (
    typeof requirement !== 'string' ||
    requirement.trim().length < 10
  ) {
    throw new Error(
      'Please provide a requirement with at least 10 characters.'
    );
  }

  try {

    console.log('Sending requirement to Gemini AI...');

    // Send requirement to Gemini API
    const response = await ai.models.generateContent({

      model: 'gemini-3.5-flash',

      contents: `
        You are a senior QA automation architect
        with expertise in enterprise software testing.

        Analyze this business requirement:

        ${requirement}

        Generate comprehensive test scenarios covering:

        1. Positive scenarios
        2. Negative scenarios
        3. Boundary conditions
        4. Edge cases

        Each scenario must include:

        - Unique scenario ID
        - Clear scenario title
        - Category
        - Priority
        - Preconditions
        - Practical test steps
        - Expected result

        Do not invent application features that are
        not supported by the requirement.

        Return only data matching the requested JSON schema.
      `,

      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: testCaseSchema
      }
    });

    // 5. Validate AI response
    if (!response.text) {
      throw new Error('Gemini returned an empty response.');
    }

    // 6. Convert JSON string into JavaScript object
    const result = JSON.parse(response.text);

    // Basic response validation
    if (!result || !Array.isArray(result.scenarios)) {
      throw new Error('Invalid test scenario response.');
    }

    console.log('Test scenarios generated successfully.');

    return result;

  } catch (error) {

    console.error(
      'AI Test Generation Failed:',
      error.message
    );

    // Handle API timeout
    if (error.status === 504) {
      throw new Error(
        'Gemini API timeout. Please try again later.'
      );
    }

    // Handle temporary Gemini service unavailability
if (error.status === 503) {
  throw new Error(
    'Gemini service is currently busy. Please try again after some time.'
  );
}

    // Handle rate limit
    if (error.status === 429) {
      throw new Error(
        'Gemini API rate limit reached. Please wait and retry.'
      );
    }

    
    // Handle authentication and permission errors
    if (error.status === 401 || error.status === 403) {
      throw new Error(
        'Gemini API authentication or permission error. Check your API key.'
      );
    }

    // Handle other errors
    throw error;
  }
}
