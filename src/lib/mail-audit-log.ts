import type { MailActionProposal } from './mail-action-planner.js';

export type MailAuditResult = 'blocked' | 'executed' | 'failed';

export interface MailAuditEntry {
  actionId: string;
  messageId: string | null;
  action: MailActionProposal['action'] | 'unknown';
  timestamp: string;
  result: MailAuditResult;
  reason: string;
}

const entries: MailAuditEntry[] = [];

/** Adds a local audit entry. This logger has no Graph or mailbox dependency. */
export function recordMailAuditEntry(
  entry: Omit<MailAuditEntry, 'timestamp'>,
  now: Date = new Date()
): MailAuditEntry {
  const stored = { ...entry, timestamp: now.toISOString() };
  entries.push(stored);
  return { ...stored };
}

/** Returns a snapshot of the process-local audit entries. */
export function getMailAuditLog(): MailAuditEntry[] {
  return entries.map((entry) => ({ ...entry }));
}
