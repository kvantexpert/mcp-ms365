import { graphMailWriteAdapter } from './graph-mail-write-adapter.js';
import { mockGraphMailWriteAdapter } from './mock-graph-mail-write-adapter.js';
import type { MailWriteAdapter } from './mail-write-adapter.js';

export type MailWriteAdapterMode = 'mock' | 'graph';

export interface MailWriteAdapterModeValidation {
  valid: boolean;
  mode: MailWriteAdapterMode | null;
  reason: string;
}

export function getMailWriteAdapterMode(): string {
  return process.env.WRITE_ADAPTER_MODE?.trim().toLowerCase() || 'mock';
}

export function validateWriteAdapterMode(
  mode: string = getMailWriteAdapterMode()
): MailWriteAdapterModeValidation {
  if (mode === 'mock' || mode === 'graph') {
    return { valid: true, mode, reason: 'adapter mode allowed' };
  }
  return { valid: false, mode: null, reason: 'write adapter mode is not allowed' };
}

export function createMailWriteAdapter(): MailWriteAdapter {
  const validation = validateWriteAdapterMode();
  if (!validation.valid || !validation.mode) {
    throw new Error(validation.reason);
  }
  return validation.mode === 'graph' ? graphMailWriteAdapter : mockGraphMailWriteAdapter;
}
