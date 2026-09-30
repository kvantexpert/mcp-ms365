import { describe, expect, it } from 'vitest';
import { buildAuthDiagnostic } from '../src/lib/auth-diagnostic.js';

function input(serializedCache = '{}') {
  return {
    cacheLocation: 'C:/safe/cache.json',
    cacheFileExists: false,
    cacheReadable: false,
    storage: 'default (encrypted file)',
    clientId: 'client-id',
    tenantId: 'common',
    selectedAccountId: null,
    accounts: [],
    serializedCache,
    now: Date.parse('2026-09-30T00:00:00.000Z'),
  };
}

describe('OAuth auth diagnostics', () => {
  it('reports a missing token cache and account without throwing', () => {
    expect(buildAuthDiagnostic(input())).toMatchObject({
      status: 'no-account',
      account: { count: 0 },
      cachedAccessTokens: [],
      graphApiCalls: 0,
    });
    expect(buildAuthDiagnostic(input('null')).cachedAccessTokens).toEqual([]);
  });

  it('reports safe account, scope and expiry metadata without exposing credentials', () => {
    const serialized = JSON.stringify({
      AccessToken: {
        entry: {
          home_account_id: 'account-id',
          target: 'Mail.ReadWrite User.Read',
          expiresOn: String(Date.parse('2030-01-01T00:00:00.000Z') / 1000),
          secret: 'ACCESS_TOKEN_SECRET_SENTINEL',
        },
      },
      RefreshToken: {
        entry: { secret: 'REFRESH_TOKEN_SECRET_SENTINEL' },
      },
    });
    const report = buildAuthDiagnostic({
      ...input(serialized),
      accounts: [{ homeAccountId: 'account-id', username: 'person@example.test' }],
    });

    expect(report.status).toBe('account-found');
    expect(report.cachedAccessTokens[0]).toMatchObject({
      account: 'person@example.test',
      scopes: ['Mail.ReadWrite', 'User.Read'],
      expired: false,
    });
    expect(JSON.stringify(report)).not.toContain('ACCESS_TOKEN_SECRET_SENTINEL');
    expect(JSON.stringify(report)).not.toContain('REFRESH_TOKEN_SECRET_SENTINEL');
  });

  it('returns a diagnostic report without any Graph write capability', () => {
    const report = buildAuthDiagnostic(input('not-json'));

    expect(report.cache.parseable).toBe(false);
    expect(report.graphApiCalls).toBe(0);
  });
});
