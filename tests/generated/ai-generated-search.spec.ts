import { test, expect } from '@playwright/test';
import { CatalogPage } from '../pages/catalog.page';

test.describe('Catalog Search Specifications', () => {
  let catalog: CatalogPage;

  test.beforeEach(async ({ page }) => {
    catalog = new CatalogPage(page);
    await catalog.open();
  });

  test('TC-SEARCH-01: Search asset by exact name', async () => {
    await catalog.searchFor('Sales Transactions');
    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows.first()).toContainText('Sales Transactions');
  });

  test('TC-SEARCH-02: Search assets by partial name', async () => {
    await catalog.searchFor('Customer');
    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows.first()).toContainText('Customer Master');
  });

  test('TC-SEARCH-03: Search assets by owner name', async () => {
    await catalog.searchFor('Finance Data');
    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows.first()).toContainText('Sales Transactions');
  });

  test('TC-SEARCH-04: Search for a non-existent asset or owner', async ({ page }) => {
    await catalog.searchFor('XYZ_NonExistent_99');
    await expect(catalog.rows).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('No assets match your search.');
  });

  test('TC-SEARCH-05: Search using a single character', async () => {
    await catalog.searchFor('A');
    await expect(catalog.rows).toHaveCount(4);
  });

  test('TC-SEARCH-06: Search using a long query', async ({ page }) => {
    const longQuery = 'Z'.repeat(255);
    await catalog.searchFor(longQuery);
    await expect(catalog.rows).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('No assets match your search.');
  });

  test('TC-SEARCH-07: Search with leading and trailing whitespace', async () => {
    await catalog.searchFor('  Sales Transactions  ');
    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows.first()).toContainText('Sales Transactions');
  });

  test('TC-SEARCH-08: Search using mixed-case characters', async () => {
    await catalog.searchFor('sAlEs TrAnSaCtIoNs');
    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows.first()).toContainText('Sales Transactions');
  });
});
