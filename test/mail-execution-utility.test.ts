import { describe, expect, it } from 'vitest';
import { confirmAction, createConfirmationRequest } from '../src/lib/mail-action-confirmation.js';
import { UTILITY_TOOLS } from '../src/graph-tools.js';
import type { MailActionProposal } from '../src/lib/mail-action-planner.js';

describe('preview-mail-execution utility', () => {
  it('shows an approved request is blocked in SAFE MODE without accessing Graph', async () => {
    const graphClient = new Proxy(
      {},
      {
        get: (_target, property) => {
          throw new Error(`Unexpected Graph client access: ${String(property)}`);
        },
      }
    );
    const proposal: MailActionProposal = {
      action: 'move-message',
      messageId: 'test-message-id',
      currentFolder: 'Inbox',
      targetFolder: 'MCP-Test',
      reason: ['test proposal'],
      status: 'preview',
    };
    const confirmation = confirmAction(createConfirmationRequest(proposal).id);
    const utility = UTILITY_TOOLS.find((tool) => tool.name === 'preview-mail-execution');

    expect(utility?.readOnlyHint).toBe(true);
    expect(utility?.openWorldHint).toBe(false);

    const result = await utility!.execute({ confirmationId: confirmation.id }, {
      graphClient,
    } as never);
    const response = JSON.parse(result.content[0].text);

    expect(response.action).toBe('move-message');
    expect(response.target).toBe('MCP-Test');
    expect(response.status).toBe('blocked');
    expect(response.reason).toBe('controlled write execution disabled');
    expect(response.dryRun).toBe(true);
  });
});
