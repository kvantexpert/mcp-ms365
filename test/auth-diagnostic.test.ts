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
          expiresOn: '2030-01-01 00:00:00.000 UTC',
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
      requestedScopes: ['Mail.ReadWrite', 'User.Read'],
      grantedScopes: null,
      expired: false,
    });
    expect(JSON.stringify(report)).not.toContain('ACCESS_TOKEN_SECRET_SENTINEL');
    expect(JSON.stringify(report)).not.toContain('REFRESH_TOKEN_SECRET_SENTINEL');
  });

  it('extracts only actual granted scopes from a cached JWT without returning the JWT', () => {
    const accessToken = [
      'header',
      Buffer.from(
        JSON.stringify({ scp: 'Mail.ReadWrite MailboxSettings.Read User.Read Calendars.ReadWrite' })
      ).toString('base64url'),
      'signature',
    ].join('.');
    const report = buildAuthDiagnostic({
      ...input(
        JSON.stringify({
          AccessToken: {
            entry: {
              target: 'Mail.ReadWrite MailboxSettings.Read User.Read',
              secret: accessToken,
            },
          },
        })
      ),
    });

    expect(report.cachedAccessTokens[0].grantedScopes).toEqual([
      'Mail.ReadWrite',
      'MailboxSettings.Read',
      'User.Read',
      'Calendars.ReadWrite',
    ]);
    expect(JSON.stringify(report)).not.toContain(accessToken);
  });

  it('returns a diagnostic report without any Graph write capability', () => {
    const report = buildAuthDiagnostic(input('not-json'));

    expect(report.cache.parseable).toBe(false);
    expect(report.graphApiCalls).toBe(0);
  });
});
