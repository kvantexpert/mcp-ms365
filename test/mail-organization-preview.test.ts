import { describe, expect, it, vi } from 'vitest';
import { UTILITY_TOOLS } from '../src/graph-tools.js';

describe('preview-mail-organization utility', () => {
  it('returns a Finance dry-run preview without accessing Graph', async () => {
    const graphClient = new Proxy(
      {},
      {
        get: (_target, property) => {
          throw new Error(`Unexpected Graph client access: ${String(property)}`);
        },
      }
    );
    const utility = UTILITY_TOOLS.find((tool) => tool.name === 'preview-mail-organization');
    expect(utility).toBeDefined();
    expect(utility?.readOnlyHint).toBe(true);

    const result = await utility!.execute(
      {
        messageId: 'message-1',
        subject: 'Invoice September',
        sender: 'Supplier',
        senderEmail: 'billing@supplier.test',
        bodyPreview: '',
        receivedDateTime: '2026-09-30T10:00:00Z',
        currentFolder: 'Inbox',
      },
      { graphClient } as never
    );

    const preview = JSON.parse(result.content[0].text);
    expect(preview.classification.category).toBe('Finance');
    expect(preview.suggestedAction.targetFolder).toBe('Finance/Invoices');
    expect(preview.suggestedAction.status).toBe('preview');
    expect(preview.mode).toBe('DRY RUN');
    expect(preview.mailboxChangesPerformed).toBe(false);
    expect(preview.message).toBe('No changes performed.');
  });

  it('is a closed-world read-only utility', () => {
    const utility = UTILITY_TOOLS.find((tool) => tool.name === 'preview-mail-organization');
    expect(utility?.readOnlyHint).toBe(true);
    expect(utility?.openWorldHint).toBe(false);
  });
});
