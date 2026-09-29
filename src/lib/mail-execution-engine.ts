import { randomUUID } from 'crypto';
import { getConfirmationStatus } from './mail-action-confirmation.js';
import { recordMailAuditEntry } from './mail-audit-log.js';
import type { MailActionProposal } from './mail-action-planner.js';

export type ExecutionStatus = 'ready' | 'blocked' | 'executed' | 'failed';

export interface ExecutionRequest {
  id: string;
  confirmationId: string;
  action: MailActionProposal['action'] | 'unknown';
  messageId: string | null;
  target: string | null;
  status: ExecutionStatus;
  dryRun: true;
  createdAt: string;
  reason: string;
}

const executionRequests = new Map<string, ExecutionRequest>();
const ALLOWED_ACTIONS = new Set<string>(['move-message']);

function snapshot(request: ExecutionRequest): ExecutionRequest {
  return { ...request };
}

/** Creates an execution request, but never performs the proposed operation. */
export function prepareExecution(confirmationId: string, now: Date = new Date()): ExecutionRequest {
  const confirmation = getConfirmationStatus(confirmationId, now);
  const proposal = confirmation?.actionProposal;
  let reason = '';

  if (!confirmation) {
    reason = 'confirmation not found';
  } else if (confirmation.status !== 'approved') {
    reason = `confirmation status is ${confirmation.status}`;
  } else if (!proposal || !ALLOWED_ACTIONS.has(proposal.action)) {
    reason = 'action not allowed';
  } else if (!proposal.messageId.trim() || !proposal.targetFolder.trim()) {
    reason = 'message id and target are required';
  }

  const request: ExecutionRequest = {
    id: randomUUID(),
    confirmationId,
    action: proposal?.action ?? 'unknown',
    messageId: proposal?.messageId ?? null,
    target: proposal?.targetFolder ?? null,
    status: reason ? 'blocked' : 'ready',
    dryRun: true,
    createdAt: now.toISOString(),
    reason: reason || 'approved confirmation; execution is disabled in SAFE MODE',
  };
  executionRequests.set(request.id, request);
  return snapshot(request);
}

/**
 * SAFE MODE stub. Even a ready request is blocked and audited; no Graph client
 * is accepted or called by this module.
 */
export function executeAction(id: string, now: Date = new Date()): ExecutionRequest {
  const request = executionRequests.get(id);
  if (!request) throw new Error(`Execution request not found: ${id}`);

  if (request.status === 'ready') {
    request.status = 'blocked';
    request.reason = 'write execution disabled';
  }

  recordMailAuditEntry(
    {
      actionId: request.id,
      messageId: request.messageId,
      action: request.action,
      result: request.status === 'blocked' ? 'blocked' : 'failed',
      reason: request.reason,
    },
    now
  );

  return snapshot(request);
}

/** Returns the current local execution request state. */
export function getExecutionStatus(id: string): ExecutionRequest | undefined {
  const request = executionRequests.get(id);
  return request ? snapshot(request) : undefined;
}
