import { randomUUID } from 'crypto';
import type { MailWriteAdapter, MailWriteAdapterResult } from './mail-write-adapter.js';

/** Local simulation only. This adapter has no Graph client or network dependency. */
export const mockMailWriteAdapter: MailWriteAdapter = {
  async createFolder(_input): Promise<MailWriteAdapterResult> {
    return {
      status: 'success',
      mode: 'mock',
      operation: 'create-folder',
      resourceId: `mock-folder-${randomUUID()}`,
      graph: false,
    };
  },
  async moveMessage(_input): Promise<MailWriteAdapterResult> {
    return {
      status: 'success',
      mode: 'mock',
      operation: 'move-message',
      resourceId: `mock-message-${randomUUID()}`,
      graph: false,
    };
  },
};
