import { describe, expect, it } from 'vitest';
import { resolveAuthScopes, buildAllowedScopeDiagnostics } from '../src/auth.js';
import { buildPermissionSourceAudit } from '../src/lib/permission-source-audit.js';
import {
  analyzePermissionScopes,
  PERMISSION_CLEANUP_EXPECTED_SCOPES,
} from '../src/lib/permission-cleanup-analysis.js';
import { getCombinedPresetPattern } from '../src/tool-categories.js';

describe('permission source audit', () => {
  it('builds the controlled preset request from only tool and explicit scopes', () => {
    const args = {
      preset: 'mail-write-controlled',
      enabledTools: getCombinedPresetPattern(['mail-write-controlled']),
      extraScopes: 'MailboxSettings.Read User.Read',
    };

    expect(buildAllowedScopeDiagnostics(args).toolPermissions).toEqual(['Mail.ReadWrite']);
    expect(resolveAuthScopes(args)).toEqual([
      'Mail.ReadWrite',
      'MailboxSettings.Read',
      'User.Read',
    ]);
  });

  it('detects broad MSAL cache scope metadata separately from verified grants', () => {
    const result = analyzePermissionScopes(PERMISSION_CLEANUP_EXPECTED_SCOPES, [
      {
        grantedScopes: null,
        requestedScopes: [
          'Mail.ReadWrite',
          'MailboxSettings.Read',
          'User.Read',
          'Mail.Send',
          'Calendars.ReadWrite',
          'Files.ReadWrite',
        ],
      },
    ]);

    expect(result.grantVerified).toBe(false);
    expect(result.scopeSource).toBe('msal-cache-target');
    expect(result.extra).toEqual(['Calendars.ReadWrite', 'Files.ReadWrite', 'Mail.Send']);
  });

  it('does not copy environment secrets into the report', () => {
    const report = buildPermissionSourceAudit({
      clientId: 'public-client-id',
      tenant: 'consumers',
      cloudType: 'global',
      cacheLocation: 'C:/auth/cache',
      requestedScopes: ['Mail.ReadWrite', 'MailboxSettings.Read', 'User.Read'],
      presetScopes: ['Mail.ReadWrite'],
      args: { preset: 'mail-write-controlled' },
      env: {
        MS365_MCP_CLIENT_SECRET: 'client-secret-marker',
        MS365_MCP_OAUTH_TOKEN: 'access-token-marker',
        MS365_MCP_KEYVAULT_URL: 'https://vault.example/secretdomain',
        MS365_MCP_EXTRA_SCOPES: 'Mail.Send',
      },
      argv: [],
    });
    const serialized = JSON.stringify(report);

    expect(serialized).not.toContain('client-secret-marker');
    expect(serialized).not.toContain('access-token-marker');
    expect(serialized).not.toContain('secretdomain');
    expect(report.environmentOverrides.clientSecret.configured).toBe(true);
  });

  it('is a local scope audit and makes no Graph write calls', () => {
    const report = buildPermissionSourceAudit({
      clientId: 'public-client-id',
      tenant: 'consumers',
      cloudType: 'global',
      cacheLocation: 'cache',
      requestedScopes: [],
      presetScopes: [],
      args: {},
      env: {},
      argv: [],
    });

    expect(report.graphApiCalls).toBe(0);
    expect(report.scopeConstructionSource).toHaveLength(4);
  });
});
