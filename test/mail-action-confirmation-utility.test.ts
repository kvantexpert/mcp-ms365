import { describe, expect, it } from 'vitest';
import { UTILITY_TOOLS } from '../src/graph-tools.js';

describe('preview-mail-action-confirmation utility', () => {
  it('creates a pending local request and does not access Graph', async () => {
    const graphClient = new Proxy(
      {},
      {
        get: (_target, property) => {
          throw new Error(`Unexpected Graph client access: ${String(property)}`);
        },
      }
    );
    const utility = UTILITY_TOOLS.find((tool) => tool.name === 'preview-mail-action-confirmation');
    expect(utility?.readOnlyHint).toBe(true);
    expect(utility?.openWorldHint).toBe(false);

    const result = await utility!.execute(
      {
        messageId: 'message-1',
        target: 'Finance/Invoices',
        reason: ['invoice keyword detected'],
        currentFolder: 'Inbox',
      },
      { graphClient } as never
    );
    const response = JSON.parse(result.content[0].text);

    expect(response.action).toBe('move-message');
    expect(response.target).toBe('Finance/Invoices');
    expect(response.reason).toEqual(['invoice keyword detected']);
    expect(response.status).toBe('pending');
    expect(response.message).toBe('Waiting user confirmation');
    expect(response.executionPerformed).toBe(false);
  });
});
