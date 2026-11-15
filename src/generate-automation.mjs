
import {
  generatePlaywrightAutomation
} from './ai-test-automation-generator.mjs';

try {
  console.log('Starting AI automation generation...');

  await generatePlaywrightAutomation();

  console.log('Automation generation completed.');

} catch (error) {
  console.error('Failed:', error.message);
  process.exitCode = 1;
}
