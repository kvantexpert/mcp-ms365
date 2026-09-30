import { describe, expect, it } from 'vitest';
import { analyzePermissionScopes } from '../src/lib/permission-cleanup-analysis.js';

const expected = ['Mail.ReadWrite', 'MailboxSettings.Read', 'User.Read'];

describe('permission cleanup analysis', () => {
  it('compares expected scopes with verified granted scopes', () => {
    const result = analyzePermissionScopes(expected, [
      {
        grantedScopes: ['Mail.ReadWrite', 'MailboxSettings.Read', 'User.Read'],
        requestedScopes: [],
      },
    ]);

    expect(result).toMatchObject({
      scopeSource: 'access-token-scp',
      grantVerified: true,
      missing: [],
      extra: [],
    });
  });

  it('detects unexpected Graph scopes and preserves the existing Mail.Read baseline', () => {
    const result = analyzePermissionScopes(expected, [
      {
        grantedScopes: null,
        requestedScopes: [
          ...expected,
          'Mail.Read',
          'Mail.Send',
          'Calendars.ReadWrite',
          'openid',
          'profile',
        ],
      },
    ]);

    expect(result.scopeSource).toBe('msal-cache-target');
    expect(result.grantVerified).toBe(false);
    expect(result.extra).toEqual(['Calendars.ReadWrite', 'Mail.Send']);
    expect(result.existingBaseline).toEqual(['Mail.Read']);
    expect(result.oidcScopes).toEqual(['openid', 'profile']);
  });

  it('does not include tokens or secrets in the report', () => {
    const secret = 'DO_NOT_PRINT_ACCESS_OR_REFRESH_TOKEN';
    const entry = {
      grantedScopes: null,
      requestedScopes: ['Mail.ReadWrite'],
      accessToken: secret,
      refreshToken: secret,
    };
    const report = JSON.stringify(analyzePermissionScopes(expected, [entry]));

    expect(report).not.toContain(secret);
  });

  it('performs local analysis without Graph calls or write capability', () => {
    const result = analyzePermissionScopes(expected, []);

    expect(result.graphApiCalls).toBe(0);
    expect(result.scopeSource).toBe('unavailable');
    expect(result.missing).toEqual(expected);
  });
});
