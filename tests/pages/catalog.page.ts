import { expect, type Page } from '@playwright/test';

export class CatalogPage {
  constructor(private readonly page: Page) {}
  get rows() { return this.page.getByTestId('asset-row'); }
  async open() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', {name:'Enterprise Data Catalog'})).toBeVisible();
  }
  async searchFor(value: string) { await this.page.getByRole('searchbox', {name:'Search assets'}).fill(value); }
  async filterBy(type: 'All'|'Table'|'API'|'File') { await this.page.getByLabel('Asset type').selectOption(type); }
  async clearFilters() { await this.page.getByRole('button', {name:'Clear filters'}).click(); }
  async viewAsset(name: string) {
    await this.rows.filter({hasText:name}).getByRole('button', {name:'View'}).click();
  }
}
