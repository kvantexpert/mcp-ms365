import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import {
  confirmAction,
  createConfirmationRequest,
  rejectAction,
} from '../src/lib/mail-action-confirmation.js';
import { getMailAuditLog } from '../src/lib/mail-audit-log.js';
import {
  executeAction,
  getExecutionStatus,
  prepareExecution,
} from '../src/lib/mail-execution-engine.js';
import type { MailActionProposal } from '../src/lib/mail-action-planner.js';

function makeProposal(): MailActionProposal {
  return {
    action: 'move-message',
    messageId: 'test-message-id',
    currentFolder: 'Inbox',
    targetFolder: 'MCP-Test',
    reason: ['test proposal'],
    status: 'preview',
  };
}

function approvedConfirmation() {
  const confirmation = createConfirmationRequest(makeProposal());
  return confirmAction(confirmation.id);
}

describe('mail execution engine SAFE MODE', () => {
  it('creates a ready, dry-run execution request for an approved confirmation', () => {
    const confirmation = approvedConfirmation();
    const request = prepareExecution(confirmation.id);

    expect(request.confirmationId).toBe(confirmation.id);
    expect(request.action).toBe('move-message');
    expect(request.target).toBe('MCP-Test');
    expect(request.status).toBe('ready');
    expect(request.dryRun).toBe(true);
    expect(getExecutionStatus(request.id)).toEqual(request);
  });

  it('blocks execution even when confirmation is approved', () => {
    const confirmation = approvedConfirmation();
    const request = prepareExecution(confirmation.id);

    const result = executeAction(request.id);

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('write execution disabled');
    expect(result.dryRun).toBe(true);
  });

  it('has no Graph client dependency or write operation calls', () => {
    const source = readFileSync(
      new URL('../src/lib/mail-execution-engine.ts', import.meta.url),
      'utf8'
    );

    expect(source).not.toMatch(/GraphClient|graphClient/);
    expect(source).not.toMatch(/move-mail-message|create-mail-folder|create-mail-rule/);
  });

  it('writes a local audit entry for the blocked execution', () => {
    const confirmation = approvedConfirmation();
    const request = prepareExecution(confirmation.id);
    const result = executeAction(request.id, new Date('2026-09-30T12:00:00.000Z'));
    const audit = getMailAuditLog().find((entry) => entry.actionId === request.id);

    expect(audit).toEqual({
      actionId: request.id,
      messageId: 'test-message-id',
      action: 'move-message',
      timestamp: '2026-09-30T12:00:00.000Z',
      result: 'blocked',
      reason: 'write execution disabled',
    });
    expect(result.status).toBe('blocked');
  });

  it('blocks execution for rejected confirmations', () => {
    const confirmation = createConfirmationRequest(makeProposal());
    const rejected = rejectAction(confirmation.id);
    const request = prepareExecution(rejected.id);

    expect(request.status).toBe('blocked');
    expect(request.reason).toBe('confirmation status is rejected');
    expect(executeAction(request.id).status).toBe('blocked');
  });

  it('blocks a missing confirmation', () => {
    const request = prepareExecution('missing-confirmation');

    expect(request.status).toBe('blocked');
    expect(request.reason).toBe('confirmation not found');
  });

  it('blocks an action that is not on the execution allowlist', () => {
    const unsupportedProposal = {
      ...makeProposal(),
      action: 'create-mail-rule',
    } as unknown as MailActionProposal;
    const confirmation = confirmAction(createConfirmationRequest(unsupportedProposal).id);
    const request = prepareExecution(confirmation.id);

    expect(request.status).toBe('blocked');
    expect(request.reason).toBe('action not allowed');
  });
});
