
import { expect, type Page } from '@playwright/test';

export class CatalogPage {
  constructor(private readonly page: Page) {}

  // Asset table rows
  get rows() {
    return this.page.getByTestId('asset-row');
  }

  // Asset details section and fields
  get details() {
    return this.page.locator('#details');
  }

  get detailName() {
    return this.page.locator('#detail-name');
  }

  get detailId() {
    return this.page.locator('#detail-id');
  }

  get detailDescription() {
    return this.page.locator('#detail-description');
  }

  get detailOwner() {
    return this.page.locator('#detail-owner');
  }

  async open() {
    await this.page.goto('/');

    await expect(
      this.page.getByRole('heading', {
        name: 'Enterprise Data Catalog'
      })
    ).toBeVisible();
  }

  async searchFor(value: string) {
    await this.page
      .getByRole('searchbox', { name: 'Search assets' })
      .fill(value);
  }

  async filterBy(type: 'All' | 'Table' | 'API' | 'File') {
    await this.page
      .getByLabel('Asset type')
      .selectOption(type);
  }

  async clearFilters() {
    await this.page
      .getByRole('button', { name: 'Clear filters' })
      .click();
  }

  async viewAsset(name: string) {
    await this.rows
      .filter({ hasText: name })
      .getByRole('button', { name: 'View' })
      .click();
  }

  // Verify the details displayed after clicking View.
  async expectAssetDetails(name: string, owner: string) {
    await expect(this.details).toBeVisible();

    await expect(this.detailName).toHaveText(name);

    await expect(this.detailOwner).toHaveText(owner);

    await expect(this.detailId).not.toBeEmpty();

    await expect(this.detailDescription).not.toBeEmpty();
  }
}
