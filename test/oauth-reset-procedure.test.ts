import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildAuthCacheResetPreview } from '../src/lib/oauth-reset-dry-run.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('OAuth consent reset dry-run preview', () => {
  it('does not delete or modify local cache files', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'oauth-reset-preview-'));
    temporaryDirectories.push(directory);
    const tokenCachePath = path.join(directory, '.token-cache.json');
    const selectedAccountPath = path.join(directory, '.selected-account.json');
    const cacheKeyPath = path.join(directory, '.cache-key');
    writeFileSync(tokenCachePath, 'encrypted-cache-sentinel');
    writeFileSync(selectedAccountPath, '{"account":"sentinel"}');
    writeFileSync(cacheKeyPath, 'encryption-key-sentinel');

    const report = buildAuthCacheResetPreview({
      tokenCachePath,
      tokenCacheFileExists: true,
      selectedAccountPath,
      selectedAccountFileExists: true,
      cacheKeyPath,
      cacheKeyFileExists: true,
    });

    expect(report.actionsTaken).toEqual([]);
    expect(readFileSync(tokenCachePath, 'utf8')).toBe('encrypted-cache-sentinel');
    expect(readFileSync(selectedAccountPath, 'utf8')).toBe('{"account":"sentinel"}');
    expect(readFileSync(cacheKeyPath, 'utf8')).toBe('encryption-key-sentinel');
  });

  it('does not include cache secret values in the report', () => {
    const report = buildAuthCacheResetPreview({
      tokenCachePath: 'C:/auth/.token-cache.json',
      tokenCacheFileExists: true,
      selectedAccountPath: 'C:/auth/.selected-account.json',
      selectedAccountFileExists: true,
      cacheKeyPath: 'C:/auth/.cache-key',
      cacheKeyFileExists: true,
    });

    expect(JSON.stringify(report)).not.toContain('encrypted-cache-sentinel');
    expect(JSON.stringify(report)).not.toContain('encryption-key-sentinel');
  });

  it('is a local preview and makes no Graph calls', () => {
    const report = buildAuthCacheResetPreview({
      tokenCachePath: 'token-cache',
      tokenCacheFileExists: false,
      selectedAccountPath: 'selected-account',
      selectedAccountFileExists: false,
      cacheKeyPath: 'cache-key',
      cacheKeyFileExists: false,
    });

    expect(report.mode).toBe('dry-run');
    expect(report.graphApiCalls).toBe(0);
    expect(report.keychainRecords).toBe('not inspected');
  });
});
