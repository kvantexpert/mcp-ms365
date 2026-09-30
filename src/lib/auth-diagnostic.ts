import { getGrantedPermissionsFromAccessToken } from './write-permission-validation.js';

export interface AuthDiagnosticInput {
  cacheLocation: string;
  cacheFileExists: boolean;
  cacheReadable: boolean;
  storage: string;
  authenticationMode?: string;
  clientId: string;
  tenantId: string;
  selectedAccountId: string | null;
  accounts: Array<{
    homeAccountId: string;
    username?: string;
    name?: string;
  }>;
  serializedCache: string;
  now?: number;
}

interface CachedAccessToken {
  home_account_id?: unknown;
  target?: unknown;
  expiresOn?: unknown;
  expires_on?: unknown;
  secret?: unknown;
}

interface SerializedMsalCache {
  AccessToken?: Record<string, CachedAccessToken>;
}

const SCOPE_NAME = /^[A-Za-z][A-Za-z0-9._-]*$/;

/** Builds a safe report from MSAL cache metadata. Credential secrets are never copied out. */
export function buildAuthDiagnostic(input: AuthDiagnosticInput) {
  const now = input.now ?? Date.now();
  let cache: SerializedMsalCache = {};
  let cacheParseable = false;

  try {
    const parsed: unknown = JSON.parse(input.serializedCache);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      cache = parsed as SerializedMsalCache;
      cacheParseable = true;
    }
  } catch {
    // A missing or unreadable cache is a diagnostic result, not a crash.
  }

  const accessTokens = Object.values(cache.AccessToken ?? {}).flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const rawExpiry = entry.expiresOn ?? entry.expires_on;
    const expiryNumber = typeof rawExpiry === 'number' ? rawExpiry : Number(rawExpiry);
    const expiryMilliseconds =
      Number.isFinite(expiryNumber) && expiryNumber > 0
        ? expiryNumber * 1000
        : typeof rawExpiry === 'string'
          ? Date.parse(rawExpiry)
          : Number.NaN;
    const expiresAt = Number.isFinite(expiryMilliseconds) ? new Date(expiryMilliseconds) : null;
    const requestedScopes =
      typeof entry.target === 'string'
        ? [...new Set(entry.target.split(/\s+/).filter((scope) => SCOPE_NAME.test(scope)))].sort()
        : [];
    const grantedScopes =
      typeof entry.secret === 'string' ? getGrantedPermissionsFromAccessToken(entry.secret) : [];
    const account = input.accounts.find((item) => item.homeAccountId === entry.home_account_id);

    return [
      {
        account: account?.username || account?.name || 'unmatched cached account',
        expiresAt:
          expiresAt && Number.isFinite(expiresAt.getTime()) ? expiresAt.toISOString() : null,
        expired: expiresAt ? expiresAt.getTime() <= now : null,
        requestedScopes,
        grantedScopes: grantedScopes.length > 0 ? grantedScopes : null,
      },
    ];
  });

  return {
    status: input.accounts.length > 0 ? 'account-found' : 'no-account',
    authenticationMode: input.authenticationMode ?? 'local-msal-cache',
    clientId: input.clientId,
    tenantId: input.tenantId,
    cache: {
      location: input.cacheLocation,
      fileExists: input.cacheFileExists,
      readable: input.cacheReadable,
      parseable: cacheParseable,
      storage: input.storage,
    },
    account: {
      count: input.accounts.length,
      selected:
        input.accounts.find((item) => item.homeAccountId === input.selectedAccountId)?.username ??
        input.accounts.find((item) => item.homeAccountId === input.selectedAccountId)?.name ??
        null,
      identities: input.accounts.map((item) => item.username || item.name || 'unknown'),
    },
    cachedAccessTokens: accessTokens,
    graphApiCalls: 0,
  };
}
