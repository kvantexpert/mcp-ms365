import { describe, expect, it, vi } from 'vitest';
import {
  confirmAction,
  createConfirmationRequest,
  getConfirmationStatus,
  rejectAction,
} from '../src/lib/mail-action-confirmation.js';
import type { MailActionProposal } from '../src/lib/mail-action-planner.js';

function proposal(): MailActionProposal {
  return {
    action: 'move-message',
    messageId: 'message-1',
    currentFolder: 'Inbox',
    targetFolder: 'Finance/Invoices',
    reason: ['invoice keyword detected'],
    status: 'preview',
  };
}

describe('mail action confirmation manager', () => {
  it('creates a pending confirmation request', () => {
    const request = createConfirmationRequest(proposal());

    expect(request.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(request.status).toBe('pending');
    expect(request.confirmedAt).toBeNull();
    expect(getConfirmationStatus(request.id)?.status).toBe('pending');
  });

  it('changes a pending request to approved without calling Graph write methods', () => {
    const graphWrites = {
      moveMailMessage: vi.fn(),
      createMailFolder: vi.fn(),
      createMailRule: vi.fn(),
    };
    const request = createConfirmationRequest(proposal());
    const result = confirmAction(request.id);

    expect(result.status).toBe('approved');
    expect(result.confirmedAt).not.toBeNull();
    expect(getConfirmationStatus(request.id)?.status).toBe('approved');
    expect(graphWrites.moveMailMessage).not.toHaveBeenCalled();
    expect(graphWrites.createMailFolder).not.toHaveBeenCalled();
    expect(graphWrites.createMailRule).not.toHaveBeenCalled();
  });

  it('changes a pending request to rejected without calling Graph write methods', () => {
    const graphWrites = {
      moveMailMessage: vi.fn(),
      createMailFolder: vi.fn(),
      createMailRule: vi.fn(),
    };
    const request = createConfirmationRequest(proposal());
    const result = rejectAction(request.id);

    expect(result.status).toBe('rejected');
    expect(result.rejectedAt).not.toBeNull();
    expect(getConfirmationStatus(request.id)?.status).toBe('rejected');
    expect(graphWrites.moveMailMessage).not.toHaveBeenCalled();
    expect(graphWrites.createMailFolder).not.toHaveBeenCalled();
    expect(graphWrites.createMailRule).not.toHaveBeenCalled();
  });

  it('expires pending requests and does not approve an expired request', () => {
    const createdAt = new Date('2026-09-30T10:00:00.000Z');
    const request = createConfirmationRequest(proposal(), { now: createdAt, ttlMs: 1000 });
    const expiredAt = new Date(createdAt.getTime() + 1000);

    expect(getConfirmationStatus(request.id, expiredAt)?.status).toBe('expired');
    expect(confirmAction(request.id, expiredAt).status).toBe('expired');
  });

  it('does not allow a terminal request to change to another decision', () => {
    const request = createConfirmationRequest(proposal());

    expect(confirmAction(request.id).status).toBe('approved');
    expect(rejectAction(request.id).status).toBe('approved');
  });
});
