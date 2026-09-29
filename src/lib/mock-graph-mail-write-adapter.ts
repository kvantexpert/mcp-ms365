import { randomUUID } from 'crypto';
import type { MailWriteAdapter, MailWriteAdapterResult } from './mail-write-adapter.js';

/** Graph-shaped local simulation. `graph: false` guarantees no Graph request occurred. */
export const mockGraphMailWriteAdapter: MailWriteAdapter = {
  async createFolder(): Promise<MailWriteAdapterResult> {
    return {
      status: 'mock-success',
      mode: 'mock',
      operation: 'create-folder',
      resourceId: `mock-graph-folder-${randomUUID()}`,
      graph: false,
    };
  },
  async moveMessage(): Promise<MailWriteAdapterResult> {
    return {
      status: 'mock-success',
      mode: 'mock',
      operation: 'move-message',
      resourceId: `mock-graph-message-${randomUUID()}`,
      graph: false,
    };
  },
};
