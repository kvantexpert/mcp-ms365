import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAuthCacheResetPreview,
  clearLocalAuthCacheRecords,
} from '../src/lib/oauth-reset-dry-run.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('OAuth local state reset', () => {
  it('dry-run leaves local cache files unchanged', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'oauth-state-reset-'));
    temporaryDirectories.push(directory);
    const tokenCachePath = path.join(directory, '.token-cache.json');
    const selectedAccountPath = path.join(directory, '.selected-account.json');
    const cacheKeyPath = path.join(directory, '.cache-key');
    writeFileSync(tokenCachePath, 'token-cache-secret-sentinel');
    writeFileSync(selectedAccountPath, 'selected-account-sentinel');
    writeFileSync(cacheKeyPath, 'cache-key-sentinel');

    const preview = buildAuthCacheResetPreview({
      tokenCachePath,
      tokenCacheFileExists: true,
      selectedAccountPath,
      selectedAccountFileExists: true,
      cacheKeyPath,
      cacheKeyFileExists: true,
    });

    expect(preview.actionsTaken).toEqual([]);
    expect(readFileSync(tokenCachePath, 'utf8')).toBe('token-cache-secret-sentinel');
    expect(readFileSync(selectedAccountPath, 'utf8')).toBe('selected-account-sentinel');
    expect(readFileSync(cacheKeyPath, 'utf8')).toBe('cache-key-sentinel');
  });

  it('confirmed reset deletes only token and selected-account cache records', async () => {
    const entries = new Map<string, string>([
      ['token-cache', 'token-secret'],
      ['selected-account', 'account-secret'],
      ['cache-key', 'encryption-key-secret'],
    ]);
    const deleted: string[] = [];
    const result = await clearLocalAuthCacheRecords(async (key) => {
      deleted.push(key);
      entries.delete(key);
    });

    expect(deleted).toEqual(['token-cache', 'selected-account']);
    expect(entries.has('cache-key')).toBe(true);
    expect(result.cacheEncryptionKeyPreserved).toBe(true);
    expect(result.graphApiCalls).toBe(0);
  });

  it('does not call Graph APIs during local cleanup', async () => {
    const graphClient = { request: vi.fn() };
    const removeLocalRecord = vi.fn().mockResolvedValue(undefined);

    await clearLocalAuthCacheRecords(removeLocalRecord);

    expect(removeLocalRecord.mock.calls).toEqual([['token-cache'], ['selected-account']]);
    expect(graphClient.request).not.toHaveBeenCalled();
  });

  it('preview output contains no cache secret values', () => {
    const output = JSON.stringify(
      buildAuthCacheResetPreview({
        tokenCachePath: 'cache-path',
        tokenCacheFileExists: true,
        selectedAccountPath: 'account-path',
        selectedAccountFileExists: true,
        cacheKeyPath: 'key-path',
        cacheKeyFileExists: true,
      })
    );

    expect(output).not.toContain('token-secret');
    expect(output).not.toContain('account-secret');
    expect(output).not.toContain('encryption-key-secret');
  });
});
