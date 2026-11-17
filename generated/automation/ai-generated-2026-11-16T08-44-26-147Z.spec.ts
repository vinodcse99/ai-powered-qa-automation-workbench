import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../tests/pages/catalog.page';

test.describe('Enterprise Data Catalog Tests', () => {
  let catalog: CatalogPage;

  test.beforeEach(async ({ page }) => {
    catalog = new CatalogPage(page);
    await catalog.open();
  });

  test('TC-EDC-001: Search asset by partial asset name', async () => {
    await catalog.searchFor('Customer');

    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows).toContainText('Customer Master');
    await expect(catalog.rows).toContainText('Data Platform');
    await expect(catalog.rows).toContainText('Table');
  });

  test('TC-EDC-002: Search asset by partial owner name', async () => {
    await catalog.searchFor('Finance');

    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows).toContainText('Sales Transactions');
    await expect(catalog.rows).toContainText('Finance Data');
  });

  test('TC-EDC-003: Case-insensitive asset search', async () => {
    await catalog.searchFor('product reference api');

    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows).toContainText('Product Reference API');
    await expect(catalog.rows).toContainText('Product Engineering');
    await expect(catalog.rows).toContainText('API');
  });

  test('TC-EDC-004: Filter assets by Table asset type', async () => {
    await catalog.filterBy('Table');

    await expect(catalog.rows).toHaveCount(2);
    await expect(catalog.rows).toContainText(['Customer Master', 'Sales Transactions']);
  });

  test('TC-EDC-005: Clear active filters to display all assets', async () => {
    await catalog.filterBy('File');

    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows).toContainText('Supplier Data Feed');

    await catalog.clearFilters();

    await expect(catalog.rows).toHaveCount(4);
  });

  test('TC-EDC-006: View asset details', async () => {
    await catalog.viewAsset('Product Reference API');
    await catalog.expectAssetDetails('Product Reference API', 'Product Engineering');
  });

  test('TC-EDC-007: Search with non-matching asset query', async ({ page }) => {
    await catalog.searchFor('UnknownDataAsset');

    await expect(catalog.rows).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('No assets match your search.');
  });

  test('TC-EDC-008: Search asset using single character boundary input', async () => {
    await catalog.searchFor('S');

    await expect(catalog.rows).toHaveCount(3);
    await expect(catalog.rows).toContainText(['Customer Master', 'Sales Transactions', 'Supplier Data Feed']);
  });

  test('TC-EDC-009: Search asset with leading and trailing whitespace', async () => {
    await catalog.searchFor('  Supplier Data Feed  ');

    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows).toContainText('Supplier Data Feed');
    await expect(catalog.rows).toContainText('Procurement Ops');
  });

  test('TC-EDC-010: Filter by Table type with non-matching API search string', async ({ page }) => {
    await catalog.filterBy('Table');
    await catalog.searchFor('Product Reference API');

    await expect(catalog.rows).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('No assets match your search.');
  });
});
