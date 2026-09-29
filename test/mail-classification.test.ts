import { describe, expect, it } from 'vitest';
import {
  classifyMailMessage,
  type MailClassificationInput,
} from '../src/lib/mail-classification.js';

function message(overrides: Partial<MailClassificationInput> = {}): MailClassificationInput {
  return {
    subject: '',
    sender: '',
    senderEmail: '',
    bodyPreview: '',
    receivedDateTime: '2026-09-30T10:00:00Z',
    ...overrides,
  };
}

describe('classifyMailMessage', () => {
  it('classifies an invoice as Finance and suggests the invoices folder', () => {
    const result = classifyMailMessage(message({ subject: 'Invoice September' }));

    expect(result.category).toBe('Finance');
    expect(result.confidence).toBe(0.85);
    expect(result.reasons).toContain('invoice keyword detected in subject');
    expect(result.suggestedFolder).toBe('Finance/Invoices');
  });

  it('classifies a project meeting as Projects', () => {
    const result = classifyMailMessage(message({ subject: 'Project Alpha meeting' }));

    expect(result.category).toBe('Projects');
    expect(result.suggestedFolder).toBe('Projects');
  });

  it('classifies a security alert as Security', () => {
    const result = classifyMailMessage(message({ subject: 'Security alert' }));

    expect(result.category).toBe('Security');
  });

  it('defaults an ordinary email to Personal with low heuristic confidence', () => {
    const result = classifyMailMessage(
      message({
        subject: 'Hello there',
        sender: 'Alex Example',
        senderEmail: 'alex@example.test',
        bodyPreview: 'Just a quick note to say hello.',
      })
    );

    expect(result).toEqual({
      category: 'Personal',
      confidence: 0.35,
      reasons: ['No configured topic signal matched; defaulted to Personal.'],
      suggestedFolder: 'Personal',
    });
  });

  it('classifies from the message preview when the subject has no topic signal', () => {
    const result = classifyMailMessage(
      message({ bodyPreview: 'Please arrange the payment by Friday.' })
    );

    expect(result.category).toBe('Finance');
    expect(result.reasons).toContain('payment keyword detected in message preview');
  });

  it('uses sender name and domain patterns as classification signals', () => {
    const result = classifyMailMessage(
      message({
        subject: 'Account update',
        sender: 'Northwind Supplier',
        senderEmail: 'billing@northwind-vendor.test',
      })
    );

    expect(result.category).toBe('Finance');
    expect(result.reasons).toContain('sender name matches supplier pattern');
    expect(result.reasons).toContain('sender domain matches vendor pattern');
    expect(result.suggestedFolder).toBe('Finance/Invoices');
  });

  it('supports additional categories and a custom suggested folder', () => {
    const result = classifyMailMessage(message({ subject: 'Please review the NDA' }), {
      additionalRules: [
        {
          category: 'Legal',
          keywords: ['nda'],
          suggestedFolder: 'Documents/Legal',
        },
      ],
    });

    expect(result.category).toBe('Legal');
    expect(result.suggestedFolder).toBe('Documents/Legal');
  });

  it('matches topic keywords without case sensitivity', () => {
    const result = classifyMailMessage(message({ subject: 'SECURITY ALERT' }));

    expect(result.category).toBe('Security');
  });
});
