# AI-Powered QA Automation Workbench

**An AI-assisted test engineering project demonstrating how Generative AI can accelerate test design and Playwright automation while keeping execution deterministic and quality under engineering control.**

[![Playwright](https://img.shields.io/badge/Playwright-TypeScript-45ba4b?logo=playwright)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs)](https://nodejs.org/)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google)](https://ai.google.dev/)

## Project overview

Traditional test automation involves significant manual effort to convert business requirements into test scenarios, implement scripts, maintain locators, and validate test results.

This independent portfolio project explores an AI-assisted approach to those activities using Google Gemini, Playwright, TypeScript, and the Page Object Model (POM).

A sample Enterprise Data Catalog application provides realistic workflows for demonstrating search, filtering, asset discovery, and asset details.

The central engineering principle is:

**AI assists with test design and automation generation. Human review and deterministic Playwright assertions remain responsible for quality and execution results.**

This is an independent engineering portfolio project. It is not affiliated with or representative of any employer's proprietary systems.

## Key capabilities

| Capability | Status |
|---|---|
| Sample Enterprise Data Catalog application | Implemented |
| Playwright TypeScript automation framework | Implemented |
| Page Object Model | Implemented |
| UI and API automation | Implemented |
| Gemini-based AI test design component | Implemented; standalone end-to-end verification pending |
| AI-assisted Playwright automation generation | Implemented and exercised |
| Generated test quality gate | Implemented and verified |
| Scenario-to-test traceability checks | Implemented and verified |
| Generated Chromium browser execution | 18/18 passed |
| TypeScript type checking | Passed |
| AI failure analysis | Planned |
| AI test data assistant | Planned |
| LLM evaluation | Planned |
| MCP-based QA agent | Planned |

## Architecture

```text
             BUSINESS REQUIREMENT
                      |
                      v
              AI TEST DESIGN
              (Google Gemini)
                      |
                      v
            STRUCTURED SCENARIOS
                  (JSON)
                      |
                      v
          AI PLAYWRIGHT GENERATOR
              (Google Gemini)
                      |
                      v
          GENERATED TYPESCRIPT TESTS
                      |
                      v
              STATIC QUALITY GATE
          Syntax / POM / Traceability
                      |
                      v
                HUMAN REVIEW
                      |
                      v
             PLAYWRIGHT EXECUTION
                      |
                      v
             BROWSER TEST RESULTS
                 AND REPORTS
```

## Technology stack

- **Languages:** TypeScript, JavaScript
- **Runtime:** Node.js
- **UI automation:** Playwright
- **AI integration:** Google Gemini API and Google GenAI SDK
- **Design pattern:** Page Object Model
- **Testing:** UI, API, and service health checks
- **Data:** JSON test scenarios and sample catalog assets
- **Configuration:** dotenv and TypeScript configuration
- **Version control:** Git and GitHub
- **CI/CD:** GitHub Actions workflow

## Implemented components

### 1. AI Test Designer

The AI Test Designer is intended to transform natural-language business requirements into structured test scenarios.

The scenario structure includes:

- Unique test case ID
- Test title and category
- Priority
- Preconditions
- Execution steps
- Expected results

Test categories include positive, negative, boundary, and edge scenarios.

**Verification note:** The component and its integration code are implemented. Independent end-to-end execution of the standalone Test Designer is still pending.

### 2. AI Playwright Automation Generator

The automation generator uses AI to produce Playwright TypeScript test specifications from structured scenarios and existing Page Object Model context.

The generated automation is designed to:

- Reuse the existing `CatalogPage` page object.
- Use Playwright locators and assertions.
- Maintain scenario identifiers for traceability.
- Save generated test specifications for review.
- Keep generated automation separate from the original test framework.

### 3. AI Test Quality Gate

A dedicated quality gate validates generated test code before browser execution.

The implemented checks include:

- TypeScript syntax
- Playwright imports
- Page Object Model imports
- Page object instantiation
- Detail assertion usage
- Scenario ID uniqueness
- Test count
- Scenario traceability
- Assertion quality
- Test implementation quality

The quality gate is a static validation mechanism. It is separate from actual browser execution.

### 4. Generated test execution

Generated Playwright suites are executed against the sample Enterprise Data Catalog application using Chromium.

**Latest verified execution:**

| Measurement | Result |
|---|---:|
| Generated suite 1 | 8 tests |
| Generated suite 2 | 10 tests |
| Total browser tests | 18 |
| Passed | 18 |
| Failed | 0 |
| Static quality checks | 10/10 per suite |
| TypeScript typecheck | Passed |

The two generated suites achieved 100% passing results in the recorded execution.

These results represent this sample application's test scenarios, not a claim of production-system coverage.

## Sample application

The sample application represents an enterprise data catalog with four assets:

| Asset | Type | Owner |
|---|---|---|
| Customer Master | Table | Data Platform |
| Sales Transactions | Table | Finance Data |
| Product Reference API | API | Product Engineering |
| Supplier Data Feed | File | Procurement Ops |

### Automation coverage

| Layer | Test coverage |
|---|---|
| UI | Asset listing and search |
| UI | Partial and case-insensitive search |
| UI | Owner-based search |
| UI | Asset type filtering |
| UI | Clear filters |
| UI | Empty search results |
| UI | Asset details |
| API | Response status and content |
| API | Asset response and field validation |
| Service | Health endpoint |

## Project structure

```text
enterprise-data-catalog-qa/
|
+-- .github/
|   +-- workflows/
|
+-- generated/
|   +-- automation/
|   |   +-- AI-generated Playwright specifications
|   +-- rejected/
|   +-- runs/
|       +-- scenarios.json
|       +-- quality-report.json
|
+-- public/
|   +-- index.html
|
+-- scripts/
|   +-- server.mjs
|
+-- src/
|   +-- ai-test-designer.mjs
|   +-- ai-test-automation-generator.mjs
|   +-- ai-test-quality-gate.mjs
|   +-- run-ai-qa-workflow.mjs
|   +-- validate-ai-test-suite.mjs
|   +-- generate-automation.mjs
|   +-- generate-search-tests.mjs
|
+-- test-data/
|
+-- tests/
|   +-- api/
|   +-- pages/
|   +-- ui/
|
+-- .gitignore
+-- package.json
+-- package-lock.json
+-- playwright.config.ts
+-- playwright.generated.config.ts
+-- tsconfig.json
+-- README.md
```

Rejected generated specifications and historical run reports are retained separately from the active automation suite for traceability. A rejected specification must not be represented as a passing test.

## Getting started

### Prerequisites

- Node.js
- npm
- Git
- Google Gemini API key for AI-powered generation
- Visual Studio Code or another code editor

### 1. Clone the repository

```bash
git clone https://github.com/vinodcse99/ai-powered-qa-automation-workbench.git
cd ai-powered-qa-automation-workbench
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install
```

### 4. Configure the Gemini API key

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Never commit `.env` or publish API credentials.

### 5. Run the automation

```bash
# Run the standard Playwright suite
npm test

# Run Chromium tests
npm run test:chromium

# Run generated AI automation suites
npm run test:ai

# Run TypeScript type checking
npm run typecheck

# Start the sample application
npm start

# Open the standard Playwright report
npm run report
```

The generated-suite command performs static quality validation before running the generated Playwright tests.

### 6. Run the AI workflow

The project includes an AI workflow runner:

```bash
node src/run-ai-qa-workflow.mjs --language English
```

The workflow supports a language option, with English as the default. Provide a business requirement through the workflow's supported input mechanism.

AI-generated output should be reviewed before being accepted into a maintained automation suite.

## Engineering principles

### Human-in-the-loop AI

AI-generated scenarios and automation code are treated as suggestions requiring engineering review.

### Deterministic execution

Playwright assertions and application responses determine pass/fail outcomes. AI-generated explanations do not determine whether a test passes.

### Reusable automation

The Page Object Model separates application interactions from test specifications.

### Quality before execution

Generated test specifications pass through static validation before browser execution.

### Security

- API credentials are stored in environment variables.
- `.env` files are excluded through `.gitignore`.
- No production credentials or confidential employer code should be included.
- Generated automation is reviewed before acceptance.

### Transparent reporting

Implemented, verified, experimentally exercised, and planned capabilities are distinguished rather than presented as equivalent.

## Current limitations

- The AI Test Designer's standalone end-to-end execution is not yet independently verified.
- Generated automation requires human review.
- The current generator uses an existing Page Object Model; it does not independently discover an application and build an entire framework from scratch.
- The sample application contains a small set of catalog assets.
- The current browser execution evidence covers the generated Chromium suites.
- Gemini API availability and usage depend on model and account quotas.
- Historical rejected generations are retained as evidence and are not part of the passing active suites.

## Roadmap

| Enhancement | Objective |
|---|---|
| Greenfield AI framework generator | Generate an initial automation framework and POM |
| AI failure analyzer | Investigate Playwright failures and suggest root causes |
| AI test data assistant | Generate and validate synthetic test data |
| LLM quality evaluator | Evaluate response correctness, relevance, and hallucinations |
| MCP QA agent | Enable controlled interaction with approved QA tools |
| Expanded CI/CD integration | Extend automated validation and reporting |

## Interview explanation

"I developed an AI-Powered QA Automation Workbench to explore how Generative AI can reduce repetitive test engineering effort.

The project integrates Google Gemini with a Playwright TypeScript automation framework. It demonstrates AI-assisted test generation, structured scenario management, Page Object Model reuse, and a dedicated static quality gate.

I also implemented generated-suite validation and executed 18 AI-generated browser tests against a sample Enterprise Data Catalog application. All 18 tests passed in the recorded Chromium execution.

An important design decision was to keep AI assistance separate from test execution decisions. AI helps generate test scenarios and automation code, while static validation, human review, and deterministic Playwright assertions maintain engineering control."

## About

Independent QA engineering portfolio project by **Vinod Kumar Gogula**.

Focus areas:

- AI-assisted software testing
- Generative AI for test design
- Playwright and TypeScript automation
- Enterprise test automation architecture
- Page Object Model
- Responsible AI integration into QA workflows

**GitHub:** https://github.com/vinodcse99

**LinkedIn:** https://linkedin.com/in/vinod-kumar-gogula-sdet/