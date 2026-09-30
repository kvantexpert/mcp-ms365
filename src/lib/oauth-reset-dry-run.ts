export interface AuthCacheResetPreviewInput {
  tokenCachePath: string;
  tokenCacheFileExists: boolean;
  selectedAccountPath: string;
  selectedAccountFileExists: boolean;
  cacheKeyPath: string;
  cacheKeyFileExists: boolean;
}

/** Build a report only. This function never reads or changes cache contents. */
export function buildAuthCacheResetPreview(input: AuthCacheResetPreviewInput) {
  return {
    mode: 'dry-run' as const,
    status: 'preview-only' as const,
    proposedTargets: [
      {
        name: 'token-cache',
        path: input.tokenCachePath,
        fileExists: input.tokenCacheFileExists,
      },
      {
        name: 'selected-account-cache',
        path: input.selectedAccountPath,
        fileExists: input.selectedAccountFileExists,
      },
    ],
    preserved: [
      {
        name: 'cache-encryption-key',
        path: input.cacheKeyPath,
        fileExists: input.cacheKeyFileExists,
      },
    ],
    actionsTaken: [],
    graphApiCalls: 0,
  };
}

export async function clearLocalAuthCacheRecords(
  deleteRecord: (key: 'token-cache' | 'selected-account') => Promise<void>
) {
  await deleteRecord('token-cache');
  await deleteRecord('selected-account');
  return {
    status: 'cleared' as const,
    records: ['token-cache', 'selected-account'] as const,
    cacheEncryptionKeyPreserved: true,
    graphApiCalls: 0,
  };
}
