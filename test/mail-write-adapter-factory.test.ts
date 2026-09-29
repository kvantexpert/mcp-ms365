import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { confirmAction, createConfirmationRequest } from '../src/lib/mail-action-confirmation.js';
import { executeAction, prepareExecution } from '../src/lib/mail-execution-engine.js';
import {
  createMailWriteAdapter,
  validateWriteAdapterMode,
} from '../src/lib/mail-write-adapter-factory.js';
import { graphMailWriteAdapter } from '../src/lib/graph-mail-write-adapter.js';
import { mockGraphMailWriteAdapter } from '../src/lib/mock-graph-mail-write-adapter.js';
import type { MailActionProposal } from '../src/lib/mail-action-planner.js';

function folderProposal(): MailActionProposal {
  return {
    action: 'create-folder',
    parentFolderId: null,
    displayName: 'MCP-Test',
    reason: ['test-only proposal'],
    status: 'preview',
  };
}

describe('mail write adapter factory (mock only)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('selects the mock adapter by default', () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', '');

    expect(validateWriteAdapterMode()).toMatchObject({ valid: true, mode: 'mock' });
    expect(createMailWriteAdapter()).toBe(mockGraphMailWriteAdapter);
  });

  it('selects the mock adapter when WRITE_ADAPTER_MODE=mock', () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'mock');

    expect(createMailWriteAdapter()).toBe(mockGraphMailWriteAdapter);
  });

  it('selects a Graph placeholder that reports not implemented without Graph calls', async () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');

    expect(createMailWriteAdapter()).toBe(graphMailWriteAdapter);
    await expect(
      graphMailWriteAdapter.createFolder({ parentFolderId: null, displayName: 'MCP-Test' })
    ).resolves.toMatchObject({
      status: 'not-implemented',
      operation: 'create-folder',
      mode: 'graph',
      graph: false,
    });
  });

  it('routes engine execution through the selected factory adapter', async () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'mock');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    const confirmation = confirmAction(createConfirmationRequest(folderProposal()).id);
    const request = prepareExecution(confirmation.id);

    const result = await executeAction(request.id);

    expect(result.status).toBe('executed');
    expect(result.mode).toBe('mock');
    expect(result.adapterResult).toMatchObject({ status: 'mock-success', graph: false });
  });

  it('blocks the engine in graph mode while the adapter is not implemented', async () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    vi.stubEnv('WRITE_PERMISSION_REQUIRED', 'true');
    const confirmation = confirmAction(createConfirmationRequest(folderProposal()).id);
    const request = prepareExecution(confirmation.id);

    const result = await executeAction(request.id, new Date(), undefined, ['Mail.ReadWrite']);

    expect(result.status).toBe('blocked');
    expect(result.mode).toBe('graph');
    expect(result.reason).toBe('Graph write adapter not implemented');
    expect(result.adapterResult?.graph).toBe(false);
  });

  it('rejects unsupported adapter modes', () => {
    expect(validateWriteAdapterMode('remote')).toMatchObject({
      valid: false,
      reason: 'write adapter mode is not allowed',
    });
  });

  it('contains no Graph client or network call in the Graph placeholder', () => {
    const source = readFileSync(
      new URL('../src/lib/graph-mail-write-adapter.ts', import.meta.url),
      'utf8'
    );

    expect(source).not.toMatch(/GraphClient|graphClient|graphRequest|fetch\(|axios|https?:\/\//);
  });
});
