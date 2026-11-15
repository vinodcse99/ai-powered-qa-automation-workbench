import { test, expect } from '@playwright/test';
import { CatalogPage } from '../pages/catalog.page';
//import { CatalogPage } from '../../tests/pages/catalog.page';

test.describe('Data catalog UI', () => {
  let catalog: CatalogPage;
  test.beforeEach(async ({page}) => { catalog = new CatalogPage(page); await catalog.open(); });

  test('shows all four data assets', async () => {
    await expect(catalog.rows).toHaveCount(4);
    await expect(catalog.rows.first()).toContainText('Customer Master');
  });
  test('searches assets by name', async () => {
    await catalog.searchFor('Sales Transactions');
    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows.first()).toContainText('Sales Transactions');
  });
  test('filters by asset type', async () => {
    await catalog.filterBy('API');
    await expect(catalog.rows).toHaveCount(1);
    await expect(catalog.rows.first()).toContainText('Product Reference API');
  });
  test('shows empty state for no matches', async ({page}) => {
    await catalog.searchFor('unknown asset');
    await expect(catalog.rows).toHaveCount(0);
    await expect(page.getByRole('status')).toBeVisible();
  });
  test('clears selected filters', async () => {
    await catalog.filterBy('File'); await catalog.searchFor('Supplier');
    await catalog.clearFilters();
    await expect(catalog.rows).toHaveCount(4);
  });
  test('opens asset details', async ({page}) => {
    await catalog.viewAsset('Customer Master');
    await expect(page.getByRole('heading', {name:'Customer Master'})).toBeVisible();
    await expect(page.locator('#detail-id')).toHaveText('AST-1001');
  });
});
