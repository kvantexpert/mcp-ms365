import { describe, expect, it } from 'vitest';
import { classifyMailMessage } from '../src/lib/mail-classification.js';
import {
  DEFAULT_MAIL_FOLDER_STRUCTURE_RULES,
  planMailAction,
} from '../src/lib/mail-action-planner.js';

function classify(subject: string) {
  return classifyMailMessage({
    subject,
    sender: '',
    senderEmail: '',
    bodyPreview: '',
    receivedDateTime: '2026-09-30T10:00:00Z',
  });
}

describe('planMailAction', () => {
  it('creates a Finance invoice preview proposal', () => {
    const classification = classify('Invoice September');
    const proposal = planMailAction(
      { messageId: 'message-1', subject: 'Invoice September', currentFolder: 'Inbox' },
      classification,
      DEFAULT_MAIL_FOLDER_STRUCTURE_RULES
    );

    expect(classification.category).toBe('Finance');
    expect(proposal).toEqual({
      action: 'move-message',
      messageId: 'message-1',
      currentFolder: 'Inbox',
      targetFolder: 'Finance/Invoices',
      reason: expect.arrayContaining(['invoice keyword detected in subject']),
      status: 'preview',
    });
  });

  it('resolves an explicit project name from a project meeting subject', () => {
    const classification = classify('Project Alpha meeting');
    const proposal = planMailAction(
      { messageId: 'message-2', subject: 'Project Alpha meeting', currentFolder: 'Inbox' },
      classification,
      DEFAULT_MAIL_FOLDER_STRUCTURE_RULES
    );

    expect(classification.category).toBe('Projects');
    expect(proposal.targetFolder).toBe('Projects/Project Alpha');
    expect(proposal.status).toBe('preview');
  });

  it('uses the suggested category folder when no specific folder rule matches', () => {
    const classification = classify('Security alert');
    const proposal = planMailAction(
      { messageId: 'message-3', subject: 'Security alert' },
      classification,
      DEFAULT_MAIL_FOLDER_STRUCTURE_RULES
    );

    expect(classification.category).toBe('Security');
    expect(proposal.targetFolder).toBe('Security');
    expect(proposal.currentFolder).toBeNull();
  });

  it('only returns a proposal and does not perform any mailbox operation', () => {
    const proposal = planMailAction(
      { messageId: 'message-4', subject: 'Invoice September', currentFolder: 'Inbox' },
      classify('Invoice September'),
      DEFAULT_MAIL_FOLDER_STRUCTURE_RULES
    );

    expect(proposal.status).toBe('preview');
    expect(proposal.action).toBe('move-message');
  });
});
