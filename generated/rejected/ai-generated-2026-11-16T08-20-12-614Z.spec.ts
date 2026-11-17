import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../tests/pages/catalog.page';

test.describe('Enterprise Data Catalog Tests', () => {
  let catalogPage: CatalogPage;

  test.beforeEach(async ({ page }) => {
    catalogPage = new CatalogPage(page);
    await catalogPage.open();
  });

  test('TC-EDC-001: Search assets by partial asset name', async () => {
    await catalogPage.searchFor('Customer');

    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Customer Master');
  });

  test('TC-EDC-002: Search assets by partial owner name', async () => {
    await catalogPage.searchFor('Finance');

    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Sales Transactions');
  });

  test('TC-EDC-003: Verify case-insensitive search behavior', async () => {
    await catalogPage.searchFor('product reference api');

    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Product Reference API');
  });

  test('TC-EDC-004: Filter assets by Table type', async () => {
    await catalogPage.filterBy('Table');

    await expect(catalogPage.rows).toHaveCount(2);
    await expect(catalogPage.rows.nth(0)).toContainText('Customer Master');
    await expect(catalogPage.rows.nth(1)).toContainText('Sales Transactions');
  });

  test('TC-EDC-005: Filter assets by API type', async () => {
    await catalogPage.filterBy('API');

    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Product Reference API');
  });

  test('TC-EDC-006: Filter assets by File type', async () => {
    await catalogPage.filterBy('File');

    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Supplier Data Feed');
  });

  test('TC-EDC-007: Clear active filters to restore full asset listing', async () => {
    await catalogPage.filterBy('File');
    await expect(catalogPage.rows).toHaveCount(1);

    await catalogPage.clearFilters();

    await expect(catalogPage.rows).toHaveCount(4);
  });

  test('TC-EDC-008: View details of a selected asset', async () => {
    await catalogPage.viewAsset('Supplier Data Feed');
    await catalogPage.expectAssetDetails('Supplier Data Feed', 'Procurement Ops');
  });

  test('TC-EDC-009: Search for non-existent asset name or owner', async ({ page }) => {
    await catalogPage.searchFor('NonExistentAssetXYZ');

    await expect(catalogPage.rows).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('No assets match your search.');
  });

  test('TC-EDC-010: Search with single character search query', async () => {
    await catalogPage.searchFor('Data');

    await expect(catalogPage.rows).toHaveCount(2);
    await expect(catalogPage.rows.nth(0)).toContainText('Customer Master');
    await expect(catalogPage.rows.nth(1)).toContainText('Supplier Data Feed');
  });

  test('TC-EDC-011: Search asset name with leading and trailing whitespace', async () => {
    await catalogPage.searchFor('   Sales Transactions   ');

    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Sales Transactions');
  });
});