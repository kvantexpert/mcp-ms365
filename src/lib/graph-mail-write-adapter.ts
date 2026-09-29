import type { MailWriteAdapter, MailWriteAdapterResult } from './mail-write-adapter.js';

/**
 * Future Graph adapter placeholder. Intentionally has no Graph client, fetch,
 * or network dependency until a separately approved permission transition.
 */
export const graphMailWriteAdapter: MailWriteAdapter = {
  async createFolder(): Promise<MailWriteAdapterResult> {
    return {
      status: 'not-implemented',
      mode: 'graph',
      operation: 'create-folder',
      resourceId: null,
      graph: false,
    };
  },
  async moveMessage(): Promise<MailWriteAdapterResult> {
    return {
      status: 'not-implemented',
      mode: 'graph',
      operation: 'move-message',
      resourceId: null,
      graph: false,
    };
  },
};
