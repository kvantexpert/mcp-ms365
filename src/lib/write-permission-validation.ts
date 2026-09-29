export const REQUIRED_WRITE_PERMISSIONS = ['Mail.ReadWrite'] as const;

export interface RequiredPermissionValidation {
  status: 'allowed' | 'blocked';
  requiredPermissions: string[];
  grantedPermissions: string[];
  reason: string;
}

/** Checks already-granted delegated permissions. This function never requests consent. */
export function validateRequiredPermissions(
  grantedPermissions: readonly string[] | undefined
): RequiredPermissionValidation {
  const granted = [
    ...new Set((grantedPermissions ?? []).map((scope) => scope.trim()).filter(Boolean)),
  ];
  const missing = REQUIRED_WRITE_PERMISSIONS.filter((scope) => !granted.includes(scope));

  return {
    status: missing.length === 0 ? 'allowed' : 'blocked',
    requiredPermissions: [...REQUIRED_WRITE_PERMISSIONS],
    grantedPermissions: granted,
    reason:
      missing.length === 0
        ? 'required write permission available'
        : 'required write permission missing',
  };
}

/** Reads delegated scopes from an existing JWT access token without refreshing or requesting it. */
export function getGrantedPermissionsFromAccessToken(accessToken: string | undefined): string[] {
  if (!accessToken) return [];

  const parts = accessToken.split('.');
  if (parts.length !== 3) return [];

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      scp?: unknown;
    };
    return typeof payload.scp === 'string'
      ? [
          ...new Set(
            payload.scp
              .split(/\s+/)
              .map((scope) => scope.trim())
              .filter(Boolean)
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
