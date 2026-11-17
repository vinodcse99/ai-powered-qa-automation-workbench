import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../tests/pages/catalog.page';

test.describe('Enterprise Data Catalog Tests', () => {
  let catalogPage: CatalogPage;

  test.beforeEach(async ({ page }) => {
    catalogPage = new CatalogPage(page);
    await catalogPage.open();
  });

  test('TC001: Search assets by partial asset name', async () => {
    await catalogPage.searchFor('Customer');
    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Customer Master');
  });

  test('TC002: Search assets by partial owner name', async () => {
    await catalogPage.searchFor('Finance');
    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Sales Transactions');
    await expect(catalogPage.rows.first()).toContainText('Finance Data');
  });

  test('TC003: Filter assets by asset type API', async () => {
    await catalogPage.filterBy('API');
    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Product Reference API');
  });

  test('TC004: Clear active asset type filters', async () => {
    await catalogPage.filterBy('Table');
    await catalogPage.clearFilters();
    await expect(catalogPage.rows).toHaveCount(4);
  });

  test('TC005: View asset details', async () => {
    await catalogPage.viewAsset('Supplier Data Feed');
    await catalogPage.expectAssetDetails('Supplier Data Feed', 'Procurement Ops');
  });

  test('TC006: Search asset name with mixed case text', async () => {
    await catalogPage.searchFor('pRoDuCt');
    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Product Reference API');
  });

  test('TC007: Search asset name with leading and trailing whitespace', async () => {
    await catalogPage.searchFor('   Customer Master   ');
    await expect(catalogPage.rows).toHaveCount(1);
    await expect(catalogPage.rows.first()).toContainText('Customer Master');
  });

  test('TC008: Search with non-existent asset name', async ({ page }) => {
    await catalogPage.searchFor('NonExistentDataAsset999');
    await expect(catalogPage.rows).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('No assets match your search.');
  });
});