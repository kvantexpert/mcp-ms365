import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import {
  confirmAction,
  createConfirmationRequest,
  rejectAction,
} from '../src/lib/mail-action-confirmation.js';
import { executeAction, prepareExecution } from '../src/lib/mail-execution-engine.js';
import { mockMailWriteAdapter } from '../src/lib/mock-mail-write-adapter.js';
import type { MailActionProposal } from '../src/lib/mail-action-planner.js';
import type { MailWriteAdapter } from '../src/lib/mail-write-adapter.js';

function moveProposal(): MailActionProposal {
  return {
    action: 'move-message',
    messageId: 'message-test-1',
    currentFolder: 'Inbox',
    targetFolder: 'MCP-Test',
    reason: ['test-only proposal'],
    status: 'preview',
  };
}

function folderProposal(): MailActionProposal {
  return {
    action: 'create-folder',
    parentFolderId: null,
    displayName: 'MCP-Test',
    reason: ['test-only folder proposal'],
    status: 'preview',
  };
}

describe('mail write adapter preparation (mock only)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a folder through the mock adapter', async () => {
    const result = await mockMailWriteAdapter.createFolder({
      parentFolderId: null,
      displayName: 'MCP-Test',
    });

    expect(result).toMatchObject({ status: 'success', mode: 'mock', operation: 'create-folder' });
    expect(result.resourceId).toMatch(/^mock-folder-/);
  });

  it('moves a message through the mock adapter', async () => {
    const result = await mockMailWriteAdapter.moveMessage({
      messageId: 'message-test-1',
      destinationFolderId: 'folder-test-1',
    });

    expect(result).toMatchObject({ status: 'success', mode: 'mock', operation: 'move-message' });
    expect(result.resourceId).toMatch(/^mock-message-/);
  });

  it('blocks execution when WRITE_EXECUTION_ENABLED is false', async () => {
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'false');
    const confirmation = confirmAction(createConfirmationRequest(moveProposal()).id);
    const request = prepareExecution(confirmation.id);
    const adapter: MailWriteAdapter = {
      createFolder: vi.fn(mockMailWriteAdapter.createFolder),
      moveMessage: vi.fn(mockMailWriteAdapter.moveMessage),
    };

    const result = await executeAction(request.id, new Date(), adapter);

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('write execution validation failed');
    expect(adapter.moveMessage).not.toHaveBeenCalled();
  });

  it('blocks a rejected confirmation', async () => {
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    const confirmation = rejectAction(createConfirmationRequest(moveProposal()).id);
    const request = prepareExecution(confirmation.id);
    const adapter: MailWriteAdapter = {
      createFolder: vi.fn(mockMailWriteAdapter.createFolder),
      moveMessage: vi.fn(mockMailWriteAdapter.moveMessage),
    };

    const result = await executeAction(request.id, new Date(), adapter);

    expect(result.status).toBe('blocked');
    expect(adapter.moveMessage).not.toHaveBeenCalled();
  });

  it('blocks operations outside the allowlist, including send-mail', async () => {
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    const unsupported = {
      ...moveProposal(),
      action: 'send-mail',
    } as unknown as MailActionProposal;
    const confirmation = confirmAction(createConfirmationRequest(unsupported).id);
    const request = prepareExecution(confirmation.id);

    expect(request.status).toBe('blocked');
    expect(request.reason).toBe('action not allowed');
  });

  it('keeps Graph clients out of the adapter and execution pipeline', async () => {
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    const confirmation = confirmAction(createConfirmationRequest(folderProposal()).id);
    const request = prepareExecution(confirmation.id);
    const result = await executeAction(request.id);
    const adapterSource = readFileSync(
      new URL('../src/lib/mock-mail-write-adapter.ts', import.meta.url),
      'utf8'
    );

    expect(result.status).toBe('executed');
    expect(result.adapterResult?.mode).toBe('mock');
    expect(adapterSource).not.toMatch(/GraphClient|graphClient|graphRequest|graph\.microsoft\.com/);
  });
});
