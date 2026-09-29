import { randomUUID } from 'crypto';
import { getConfirmationStatus } from './mail-action-confirmation.js';
import { recordMailAuditEntry } from './mail-audit-log.js';
import type { MailActionProposal } from './mail-action-planner.js';
import { createMailWriteAdapter, validateWriteAdapterMode } from './mail-write-adapter-factory.js';
import type { MailWriteAdapter, MailWriteAdapterResult } from './mail-write-adapter.js';
import { validateRequiredPermissions } from './write-permission-validation.js';

export type ExecutionStatus = 'ready' | 'blocked' | 'executed' | 'failed';

export interface ExecutionRequest {
  id: string;
  confirmationId: string;
  action: MailActionProposal['action'] | 'unknown';
  messageId: string | null;
  target: string | null;
  status: ExecutionStatus;
  dryRun: true;
  mode: 'planning' | 'mock' | 'graph';
  createdAt: string;
  reason: string;
  adapterResult: MailWriteAdapterResult | null;
}

const executionRequests = new Map<string, ExecutionRequest>();
const ALLOWED_OPERATIONS = new Set<string>(['create-folder', 'move-message']);

/** Fail-closed runtime flag; no environment setting means SAFE MODE. */
export function isWriteExecutionEnabled(): boolean {
  return process.env.WRITE_EXECUTION_ENABLED === 'true';
}

/** Result returned by write-execution validation. */
export interface WriteExecutionValidation {
  valid: boolean;
  status: 'ready' | 'blocked';
  reason: string;
}

/** Validates the opt-in flag, the exact approved action, and the operation allowlist. */
export function validateWriteExecution(
  confirmationId: string,
  operation: string,
  now: Date = new Date(),
  grantedPermissions: readonly string[] = []
): WriteExecutionValidation {
  const blocked = (reason = 'write execution validation failed'): WriteExecutionValidation => ({
    valid: false,
    status: 'blocked',
    reason,
  });
  const adapterMode = validateWriteAdapterMode();
  if (!adapterMode.valid) return blocked();
  if (!isWriteExecutionEnabled()) return blocked();
  if (adapterMode.mode === 'graph') {
    if (process.env.WRITE_PERMISSION_REQUIRED !== 'true') {
      return blocked('WRITE_PERMISSION_REQUIRED must be true');
    }
    const permissionValidation = validateRequiredPermissions(grantedPermissions);
    if (permissionValidation.status !== 'allowed') return blocked(permissionValidation.reason);
  }
  const confirmation = getConfirmationStatus(confirmationId, now);
  if (!confirmation || confirmation.status !== 'approved') return blocked();
  if (!ALLOWED_OPERATIONS.has(operation)) return blocked();
  if (confirmation.actionProposal.action !== operation) return blocked();
  return { valid: true, status: 'ready', reason: 'approved operation for selected adapter' };
}

/** Backward-compatible eligibility helper for proposals managed by this engine. */
export function canExecuteWriteAction(confirmationId: string, now: Date = new Date()): boolean {
  const confirmation = getConfirmationStatus(confirmationId, now);
  if (!confirmation) return false;
  return validateWriteExecution(confirmationId, confirmation.actionProposal.action, now).valid;
}

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
  } else if (!proposal || !ALLOWED_OPERATIONS.has(proposal.action)) {
    reason = 'action not allowed';
  } else if (proposal.action === 'move-message' && !proposal.messageId.trim()) {
    reason = 'message id and target are required';
  } else if (proposal.action === 'move-message' && !proposal.targetFolder.trim()) {
    reason = 'message id and target are required';
  } else if (proposal.action === 'create-folder' && !proposal.displayName.trim()) {
    reason = 'folder name is required';
  }

  const request: ExecutionRequest = {
    id: randomUUID(),
    confirmationId,
    action: proposal?.action ?? 'unknown',
    messageId: proposal?.action === 'move-message' ? proposal.messageId : null,
    target:
      proposal?.action === 'move-message'
        ? proposal.targetFolder
        : proposal?.action === 'create-folder'
          ? proposal.displayName
          : null,
    status: reason ? 'blocked' : 'ready',
    dryRun: true,
    mode: 'planning',
    createdAt: now.toISOString(),
    reason: reason || 'approved confirmation; adapter execution is opt-in',
    adapterResult: null,
  };
  executionRequests.set(request.id, request);
  return snapshot(request);
}

/**
 * Executes only through the injected mock adapter after exact validation.
 * No Graph client is accepted or called by this module.
 */
export async function executeAction(
  id: string,
  now: Date = new Date(),
  adapter?: MailWriteAdapter,
  grantedPermissions: readonly string[] = []
): Promise<ExecutionRequest> {
  const request = executionRequests.get(id);
  if (!request) throw new Error(`Execution request not found: ${id}`);

  let auditResult: 'blocked' | 'executed' | 'failed' =
    request.status === 'executed' ? 'executed' : request.status === 'failed' ? 'failed' : 'blocked';
  if (request.status === 'ready') {
    const confirmation = getConfirmationStatus(request.confirmationId, now);
    const validation = validateWriteExecution(
      request.confirmationId,
      request.action,
      now,
      grantedPermissions
    );
    if (!validation.valid || !confirmation || confirmation.status !== 'approved') {
      request.status = 'blocked';
      request.mode = 'planning';
      request.reason = validation.reason;
    } else {
      try {
        const selectedAdapter = adapter ?? createMailWriteAdapter();
        request.adapterResult =
          confirmation.actionProposal.action === 'create-folder'
            ? await selectedAdapter.createFolder({
                parentFolderId: confirmation.actionProposal.parentFolderId,
                displayName: confirmation.actionProposal.displayName,
              })
            : await selectedAdapter.moveMessage({
                messageId: confirmation.actionProposal.messageId,
                destinationFolderId: confirmation.actionProposal.targetFolder,
              });
        if (request.adapterResult.status === 'not-implemented') {
          request.status = 'blocked';
          request.mode = 'graph';
          request.reason = 'Graph write adapter not implemented';
          auditResult = 'blocked';
        } else {
          request.status = 'executed';
          request.mode = request.adapterResult.mode;
          request.reason = 'mock adapter execution succeeded';
          auditResult = 'executed';
        }
      } catch (error) {
        request.status = 'failed';
        request.mode = 'planning';
        request.reason = error instanceof Error ? error.message : 'mock adapter execution failed';
        auditResult = 'failed';
      }
    }
  }

  recordMailAuditEntry(
    {
      actionId: request.id,
      messageId: request.messageId,
      action: request.action,
      result: auditResult,
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
