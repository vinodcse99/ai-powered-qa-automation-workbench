
import ts from 'typescript';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, child => visit(child, callback));
}

function isIdentifierCall(node, name) {
  return ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === name;
}

function getTestTitle(node) {
  if (!ts.isCallExpression(node) || node.arguments.length < 1) {
    return null;
  }

  const title = node.arguments[0];

  return ts.isStringLiteral(title) ||
    ts.isNoSubstitutionTemplateLiteral(title)
    ? title.text
    : null;
}

function getTestCallback(node) {
  if (!ts.isCallExpression(node) || node.arguments.length < 2) {
    return null;
  }

  const callback = node.arguments[1];

  return ts.isArrowFunction(callback) ||
    ts.isFunctionExpression(callback)
    ? callback
    : null;
}

function isExpectMatcher(node) {
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression) ||
    !/^to[A-Z]/.test(node.expression.name.text)
  ) {
    return false;
  }

  const expectation = node.expression.expression;

  return ts.isCallExpression(expectation) &&
    ts.isIdentifier(expectation.expression) &&
    expectation.expression.text === 'expect';
}

function inspectTestBody(callback) {
  const calls = [];
  const matchers = [];

  visit(callback.body, node => {
    if (!ts.isCallExpression(node)) return;

    calls.push(node);

    if (isExpectMatcher(node)) {
      matchers.push(node.expression.name.text);
    }
  });

  return { calls, matchers };
}

function getScenarioIds(title) {
  return title.match(/\bTC(?:-[A-Z0-9]+)?-\d{3,}\b|\bTC\d{3,}\b/g) || [];
}

function isMethodCall(calls, methodName) {
  return calls.some(call =>
    ts.isPropertyAccessExpression(call.expression) &&
    call.expression.name.text === methodName
  );
}

async function inspectPageObject(automationFile) {
  const pageObjectFile = path.resolve(
    path.dirname(automationFile),
    '../../tests/pages/catalog.page.ts'
  );

  const code = await readFile(pageObjectFile, 'utf-8');
  const sourceFile = ts.createSourceFile(
    pageObjectFile,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  let detailsAssertionCount = 0;

  visit(sourceFile, node => {
    if (
      !ts.isMethodDeclaration(node) ||
      !node.name ||
      !ts.isIdentifier(node.name) ||
      node.name.text !== 'expectAssetDetails' ||
      !node.body
    ) {
      return;
    }

    visit(node.body, child => {
      if (ts.isCallExpression(child) && isExpectMatcher(child)) {
        detailsAssertionCount++;
      }
    });
  });

  return {
    pageObjectFile,
    detailsAssertionCount,
    detailsAssertionVerified: detailsAssertionCount > 0
  };
}

export async function validateGeneratedAutomation({
  scenarios,
  automationFile,
  reportFile
}) {
  const code = await readFile(automationFile, 'utf-8');
  const sourceFile = ts.createSourceFile(
    automationFile,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const diagnostics = sourceFile.parseDiagnostics;
  const imports = [];
  const allNodes = [];

  visit(sourceFile, node => {
    allNodes.push(node);

    if (ts.isImportDeclaration(node)) {
      imports.push(node);
    }
  });

  const playwrightImport = imports.find(
    item =>
      ts.isStringLiteral(item.moduleSpecifier) &&
      item.moduleSpecifier.text === '@playwright/test'
  );

  const pageObjectImport = imports.find(
    item =>
      ts.isStringLiteral(item.moduleSpecifier) &&
      item.moduleSpecifier.text === '../../tests/pages/catalog.page'
  );

  const testCalls = allNodes.filter(node =>
    isIdentifierCall(node, 'test')
  );

  const pageObjectInstances = allNodes.filter(node =>
    ts.isNewExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'CatalogPage'
  );

  const pageObject = await inspectPageObject(automationFile);

  const scenarioIds = scenarios.map(item => item.id);
  const uniqueScenarioIds = new Set(scenarioIds);

  const testResults = testCalls.map(testCall => {
    const title = getTestTitle(testCall);
    const callback = getTestCallback(testCall);
    const ids = title ? getScenarioIds(title) : [];
    const body = callback
      ? inspectTestBody(callback)
      : { calls: [], matchers: [] };

    const viewAssetUsed = isMethodCall(body.calls, 'viewAsset');
    const detailsAssertionUsed = isMethodCall(
      body.calls,
      'expectAssetDetails'
    );

    const delegatedDetailsAssertions =
      detailsAssertionUsed && pageObject.detailsAssertionVerified
        ? pageObject.detailsAssertionCount
        : 0;

    const assertionCount =
      body.matchers.length + delegatedDetailsAssertions;

    const findings = [];

    if (!title) {
      findings.push('Test title must be a static string.');
    }

    if (!callback) {
      findings.push('Test callback is missing or invalid.');
    }

    if (ids.length !== 1) {
      findings.push('Test must contain exactly one scenario ID.');
    }

    if (callback && assertionCount === 0) {
      findings.push('No meaningful Playwright expect assertion found.');
    }

    if (viewAssetUsed && delegatedDetailsAssertions === 0) {
      findings.push(
        'Asset details test clicks View without verified detail assertions.'
      );
    }

    return {
      title,
      scenarioId: ids.length === 1 ? ids[0] : null,
      assertionCount,
      directAssertions: body.matchers,
      delegatedDetailsAssertions,
      passed: findings.length === 0,
      findings
    };
  });

  const coverage = scenarioIds.map(id => {
    const matchingTests = testResults.filter(
      item => item.scenarioId === id
    );

    return {
      scenarioId: id,
      testCount: matchingTests.length,
      passed: matchingTests.length === 1
    };
  });

  const checks = [
    {
      name: 'TypeScript syntax',
      passed: diagnostics.length === 0,
      details: diagnostics.map(item =>
        ts.flattenDiagnosticMessageText(item.messageText, '\n')
      )
    },
    {
      name: 'Playwright import',
      passed: Boolean(playwrightImport),
      details: []
    },
    {
      name: 'CatalogPage import',
      passed: Boolean(pageObjectImport),
      details: []
    },
    {
      name: 'CatalogPage instantiation',
      passed: pageObjectInstances.length > 0,
      details: [`Found ${pageObjectInstances.length} instance(s).`]
    },
    {
      name: 'Page Object detail assertions',
      passed: pageObject.detailsAssertionVerified,
      details: [
        `Verified expectAssetDetails() assertions: ${pageObject.detailsAssertionCount}.`
      ]
    },
    {
      name: 'Scenario ID uniqueness',
      passed: uniqueScenarioIds.size === scenarioIds.length,
      details: []
    },
    {
      name: 'Test count',
      passed: testCalls.length === scenarios.length,
      details: [
        `Expected ${scenarios.length}; found ${testCalls.length}.`
      ]
    },
    {
      name: 'Scenario traceability',
      passed: coverage.every(item => item.passed),
      details: coverage
        .filter(item => !item.passed)
        .map(item =>
          `${item.scenarioId}: found ${item.testCount} matching tests.`
        )
    },
    {
      name: 'Test assertion quality',
      passed: testResults.every(item => item.assertionCount > 0),
      details: testResults
        .filter(item => item.assertionCount === 0)
        .map(item => `${item.title}: no assertions found.`)
    },
    {
      name: 'Test implementation quality',
      passed: testResults.every(item => item.passed),
      details: testResults.flatMap(item =>
        item.findings.map(finding =>
          `${item.title || 'Unnamed test'}: ${finding}`
        )
      )
    }
  ];

  const passedChecks = checks.filter(item => item.passed).length;
  const failedChecks = checks.length - passedChecks;

  const report = {
    generatedAt: new Date().toISOString(),
    automationFile: path.resolve(automationFile),
    pageObjectFile: pageObject.pageObjectFile,
    scenarioCount: scenarios.length,
    generatedTestCount: testCalls.length,
    passedChecks,
    failedChecks,
    status: failedChecks === 0 ? 'PASS' : 'FAIL',
    checks,
    scenarioCoverage: coverage,
    tests: testResults
  };

  if (reportFile) {
    await writeFile(
      reportFile,
      JSON.stringify(report, null, 2),
      'utf-8'
    );
  }

  console.log('\n======================================');
  console.log(' AI TEST QUALITY GATE');
  console.log('======================================');

  for (const check of checks) {
    console.log(`${check.passed ? '[PASS]' : '[FAIL]'} ${check.name}`);

    for (const detail of check.details) {
      console.log(`       ${detail}`);
    }
  }

  console.log('\nScenario coverage:');
  console.log(
    `${coverage.filter(item => item.passed).length}/${coverage.length}`
  );

  console.log(`Quality checks: ${passedChecks}/${checks.length}`);
  console.log(`QUALITY STATUS: ${report.status}`);

  if (reportFile) {
    console.log('Quality report:', reportFile);
  }

  if (failedChecks > 0) {
    throw new Error(
      `AI Test Quality Gate failed: ${failedChecks} check(s) failed.`
    );
  }

  return report;
}
