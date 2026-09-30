export const PERMISSION_CLEANUP_EXPECTED_SCOPES = [
  'Mail.ReadWrite',
  'MailboxSettings.Read',
  'User.Read',
] as const;

export interface CachedScopeEntry {
  grantedScopes: string[] | null;
  requestedScopes: string[];
}

const OIDC_SCOPES = new Set(['openid', 'profile', 'offline_access']);
const EXISTING_MAIL_READ_SCOPE = 'mail.read';

/** Compares the approved permission set with safe scope metadata from the local token cache. */
export function analyzePermissionScopes(
  expectedScopes: readonly string[],
  cachedEntries: readonly CachedScopeEntry[]
) {
  const grantedScopes = normalizeScopes(
    cachedEntries.flatMap((entry) => entry.grantedScopes ?? [])
  );
  const requestedScopes = normalizeScopes(cachedEntries.flatMap((entry) => entry.requestedScopes));
  const grantVerified = grantedScopes.length > 0;
  const tokenScopes = grantVerified ? grantedScopes : requestedScopes;
  const scopeSource = grantVerified
    ? 'access-token-scp'
    : requestedScopes.length > 0
      ? 'msal-cache-target'
      : 'unavailable';
  const expected = normalizeScopes([...expectedScopes]);
  const expectedSet = new Set(expected);
  const tokenSet = new Set(tokenScopes);
  const oidcScopes = tokenScopes.filter((scope) => OIDC_SCOPES.has(scope.toLowerCase()));
  const existingBaseline = tokenScopes.filter(
    (scope) => scope.toLowerCase() === EXISTING_MAIL_READ_SCOPE && !expectedSet.has(scope)
  );
  const missing = expected.filter((scope) => !tokenSet.has(scope));
  const extra = tokenScopes.filter(
    (scope) =>
      !expectedSet.has(scope) &&
      !OIDC_SCOPES.has(scope.toLowerCase()) &&
      scope.toLowerCase() !== EXISTING_MAIL_READ_SCOPE
  );

  return {
    expectedScopes: expected,
    tokenScopes,
    scopeSource,
    grantVerified,
    missing,
    extra,
    existingBaseline,
    oidcScopes,
    graphApiCalls: 0 as const,
  };
}

function normalizeScopes(scopes: readonly string[]): string[] {
  const unique = new Map<string, string>();
  for (const raw of scopes) {
    const scope = raw.trim();
    if (scope) unique.set(scope.toLowerCase(), scope);
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}
