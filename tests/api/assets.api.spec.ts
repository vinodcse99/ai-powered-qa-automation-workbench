import { test, expect } from '@playwright/test';

type Asset = {id:string; name:string; qualityScore?:number; score?:number; certified:boolean};

test('GET /api/assets returns valid data and business fields', async ({request}) => {
  const response = await request.get('/api/assets');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json() as {data:Asset[]; total:number};
  expect(body.total).toBe(4);
  expect(body.data).toHaveLength(4);
  for (const asset of body.data) {
    expect(asset.id).toMatch(/^AST-\d{4}$/);
    expect(asset.name).toBeTruthy();
    expect(typeof asset.certified).toBe('boolean');
  }
});

test('health endpoint reports service availability', async ({request}) => {
  const response = await request.get('/health');
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({status:'ok'});
});
