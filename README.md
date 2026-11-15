# AI-Powered QA Automation Workbench

**An AI-assisted test engineering project combining Google Gemini, Playwright, TypeScript, and Page Object Model (POM) to accelerate test design and automation development.**

[![Playwright](https://img.shields.io/badge/Playwright-TypeScript-45ba4b?logo=playwright)](https://playwright.dev/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?logo=nodedotjs)](https://nodejs.org/)

## Project overview

Traditional QA automation requires significant manual effort to translate business requirements into test scenarios, implement automation scripts, maintain locators, and investigate failures.

This project explores how Generative AI can assist QA engineers with test design and automation development while keeping test execution and pass/fail decisions deterministic.

The initial MVP demonstrates an AI-assisted workflow:

**Business requirement → AI-generated test scenarios → AI-generated Playwright automation → Automated execution → Test results**

The project uses a sample Enterprise Data Catalog application to demonstrate realistic enterprise search and asset discovery workflows.

This is an independent engineering portfolio project and is not affiliated with or representative of any employer's proprietary systems.

## Key capabilities

| Capability | Implementation status |
|---|---|
| Sample Enterprise Data Catalog application | Implemented |
| Playwright TypeScript automation framework | Implemented |
| Page Object Model | Implemented |
| UI and API automation | Implemented |
| AI Test Designer using Gemini | Code implemented; complete standalone execution verification pending |
| Structured test scenario generation | Eight scenarios prepared |
| AI Playwright automation generator | Implemented and executed |
| Generated automation validation | Verified |
| Generated Chromium test execution | 8 of 8 passed |
| Greenfield framework generation | Planned |
| AI Failure Analyzer | Planned |
| AI Test Data Assistant | Planned |
| LLM quality evaluation | Planned |
| MCP-based QA Agent | Planned |

## Architecture

```text
                  BUSINESS REQUIREMENT
                           |
                           v
                  AI TEST DESIGNER
                   Google Gemini
                           |
                           v
                STRUCTURED TEST SCENARIOS
                      JSON OUTPUT
                           |
                           v
              AI AUTOMATION GENERATOR
                   Google Gemini
                           |
                           v
                GENERATED PLAYWRIGHT CODE
                           |
                    HUMAN REVIEW
                           |
                           v
                PLAYWRIGHT EXECUTION
                           |
                           v
                  TEST RESULTS / REPORT
```

### Technology stack

- **Programming:** TypeScript, JavaScript, Node.js
- **Automation:** Playwright
- **AI integration:** Google Gemini API, Google GenAI SDK
- **Design pattern:** Page Object Model
- **Test coverage:** UI and API
- **Application:** Node.js-based sample Enterprise Data Catalog
- **Configuration:** dotenv, JSON
- **CI/CD:** GitHub Actions workflow

## Implemented AI agents

### 1. AI Test Designer

**Problem:** Converting business requirements into comprehensive test scenarios manually takes time and can lead to missed negative, boundary, and edge cases.

**Approach:** A Gemini-powered component accepts a natural-language requirement and requests structured test scenarios.

The intended scenario structure includes:

- Test case ID
- Test title
- Test category: Positive, Negative, Boundary, or Edge
- Priority: Critical, High, Medium, or Low
- Preconditions
- Execution steps
- Expected result

**Example business requirement:**

"As a data catalog user, I want to search assets by name or owner so that I can quickly find the required data asset."

**Output:** Structured JSON test scenarios.

**Status:** Core AI integration and scenario-generation code implemented. Complete standalone execution verification is still pending.

### 2. AI Playwright Automation Generator

**Problem:** Writing repetitive automation scripts manually increases development effort and can introduce inconsistent test implementations.

**Approach:** The automation generator uses Gemini to transform structured test scenarios into Playwright TypeScript automation code.

The generator receives:

- Structured test scenarios
- Existing Page Object Model context
- Application behaviour and supported locators
- Automation framework requirements

It generates automation code that uses the existing `CatalogPage` Page Object Model.

**Key engineering safeguards:**

- Generated code is saved separately for review.
- Generated tests are validated before use.
- The existing POM is reused.
- Human review is expected before generated code is accepted.
- Playwright assertions determine actual test outcomes.

**Verified demonstration:**

Eight generated search scenarios were executed against the sample application using Chromium.

**Result: 8/8 tests passed.**

The scenarios covered:

1. Exact asset-name search
2. Partial asset-name search
3. Owner-based search
4. Search with no matching results
5. Single-character search
6. Long search input
7. Leading and trailing spaces
8. Mixed-case search

## Sample application and automation

The sample Enterprise Data Catalog contains assets such as:

- Customer Master
- Sales Transactions
- Product Reference API
- Supplier Data Feed

The automation framework covers:

| Layer | Coverage |
|---|---|
| UI | Asset listing, search, filters, empty state, clear filters, asset details |
| API | Status code, content type, response count, field validation |
| Service | Health endpoint |

The project uses reusable page objects and semantic Playwright locators to support maintainable automation.

## Project structure

```text
enterprise-data-catalog-qa/
│
├── .github/
│   └── workflows/
│
├── generated/
│   └── automation/
│       └── ai-generated-search.spec.ts
│
├── public/
│   └── index.html
│
├── scripts/
│   └── server.mjs
│
├── src/
│   ├── ai-test-designer.mjs
│   ├── ai-test-automation-generator.mjs
│   ├── generate-automation.mjs
│   └── generate-search-tests.mjs
│
├── test-data/
│   └── generated-search-scenarios.json
│
├── tests/
│   ├── api/
│   ├── pages/
│   └── ui/
│
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

## Getting started

### Prerequisites

- Node.js and npm
- Git
- Google Gemini API key
- Visual Studio Code or another code editor

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd enterprise-data-catalog-qa
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install
```

### 4. Configure Gemini API credentials

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Never commit `.env` or publish API credentials.

### 5. Run the sample application and tests

The following commands are defined in `package.json`:

```bash
# Start the sample application
npm start

# Run the Playwright test suite
npm test

# Run tests in headed mode
npm run test:headed

# Run Chromium tests
npm run test:chromium

# TypeScript type checking
npm run typecheck

# Open the HTML Playwright report
npm run report
```

### 6. Run the AI automation generator

From the project root:

```bash
node src/generate-automation.mjs
```

This invokes the Gemini-powered automation generator and produces the generated Playwright specification in the `generated/automation/` directory.

The generated specification can be reviewed and executed using the project's Playwright configuration.

**Note:** The standalone AI Test Designer runner is still undergoing end-to-end verification. Its execution command is intentionally not documented as a verified workflow yet.

## Engineering principles

This project follows several important principles for responsible AI-assisted test engineering.

**AI assistance, not uncontrolled automation**

AI suggests scenarios and generates automation code. Engineers review the generated output before accepting it.

**Deterministic test execution**

Playwright assertions and application responses determine whether tests pass or fail. AI-generated explanations do not determine test results.

**Reusable automation**

The Page Object Model separates application interactions from test specifications.

**Security**

- API keys are stored in environment variables.
- Environment files are excluded through `.gitignore`.
- No production credentials or confidential employer code should be included.
- Generated automation should be reviewed before execution.

**Transparency**

Implemented, experimentally validated, and planned capabilities are explicitly distinguished.

## Current limitations

- The current automation generator uses an existing Page Object Model; it does not independently discover an application and build a complete framework from scratch.
- AI-generated code requires human review.
- AI Test Designer standalone end-to-end verification remains pending.
- Gemini API availability and usage are subject to model and account quotas.
- The current eight-test demonstration focuses on catalog search workflows.
- Additional agents are roadmap items, not completed capabilities.

## Roadmap

| Planned enhancement | Objective |
|---|---|
| Greenfield AI Framework Generator | Generate an initial automation framework and POM using application analysis |
| AI Failure Analyzer | Analyse Playwright failures and suggest likely root causes |
| AI Test Data Assistant | Generate and validate synthetic test data |
| LLM Quality Evaluator | Evaluate correctness, relevance, and hallucination using evaluation frameworks |
| MCP QA Agent | Enable controlled interaction with approved QA tools |
| Expanded CI/CD integration | Improve automated validation and reporting |

## Interview explanation

"I developed an AI-powered QA Automation Workbench to explore how Generative AI can reduce repetitive test engineering effort.

The initial implementation integrates Google Gemini with a Playwright TypeScript framework.

The workflow starts with business requirements and structured test scenarios. The AI automation generator then uses the scenario definitions and existing Page Object Model context to generate Playwright automation code.

I validated the generated code and executed eight search scenarios against a sample Enterprise Data Catalog application. All eight passed in Chromium.

An important design decision is that AI assists with test design and code generation, while deterministic Playwright assertions control execution and pass/fail results.

The project is being developed incrementally, with framework generation, failure analysis, test data assistance, LLM evaluation, and MCP integration planned as future enhancements."

---

## About

Independent QA engineering portfolio project focused on:

- AI-assisted software testing
- Generative AI for test design
- Playwright automation engineering
- TypeScript and reusable test frameworks
- Responsible AI integration into QA workflows
