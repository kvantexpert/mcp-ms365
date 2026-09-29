import { randomUUID } from 'crypto';
import type { MailActionProposal } from './mail-action-planner.js';

export type ConfirmationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ConfirmationRequest {
  id: string;
  actionProposal: MailActionProposal;
  status: ConfirmationStatus;
  createdAt: string;
  confirmedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string;
}

export const DEFAULT_CONFIRMATION_TTL_MS = 15 * 60 * 1000;

const confirmationRequests = new Map<string, ConfirmationRequest>();

function copyProposal(proposal: MailActionProposal): MailActionProposal {
  return { ...proposal, reason: [...proposal.reason] };
}

function snapshot(request: ConfirmationRequest): ConfirmationRequest {
  return { ...request, actionProposal: copyProposal(request.actionProposal) };
}

function expireIfNeeded(request: ConfirmationRequest, now: Date): void {
  if (request.status === 'pending' && now.getTime() >= Date.parse(request.expiresAt)) {
    request.status = 'expired';
  }
}

function requireRequest(id: string): ConfirmationRequest {
  const request = confirmationRequests.get(id);
  if (!request) throw new Error(`Confirmation request not found: ${id}`);
  return request;
}

/** Creates a local confirmation request. It does not execute its proposal. */
export function createConfirmationRequest(
  actionProposal: MailActionProposal,
  options: { now?: Date; ttlMs?: number } = {}
): ConfirmationRequest {
  if (actionProposal.status !== 'preview') {
    throw new Error('Only preview proposals can be submitted for confirmation.');
  }
  const now = options.now ?? new Date();
  const ttlMs = options.ttlMs ?? DEFAULT_CONFIRMATION_TTL_MS;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error('Confirmation request TTL must be a positive number.');
  }

  const request: ConfirmationRequest = {
    id: randomUUID(),
    actionProposal: copyProposal(actionProposal),
    status: 'pending',
    createdAt: now.toISOString(),
    confirmedAt: null,
    rejectedAt: null,
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  };
  confirmationRequests.set(request.id, request);
  return snapshot(request);
}

/** Approves a pending proposal by changing local state only. */
export function confirmAction(id: string, now: Date = new Date()): ConfirmationRequest {
  const request = requireRequest(id);
  expireIfNeeded(request, now);
  if (request.status === 'pending') {
    request.status = 'approved';
    request.confirmedAt = now.toISOString();
  }
  return snapshot(request);
}

/** Rejects a pending proposal by changing local state only. */
export function rejectAction(id: string, now: Date = new Date()): ConfirmationRequest {
  const request = requireRequest(id);
  expireIfNeeded(request, now);
  if (request.status === 'pending') {
    request.status = 'rejected';
    request.rejectedAt = now.toISOString();
  }
  return snapshot(request);
}

/** Returns a copy of the request and marks overdue pending requests expired. */
export function getConfirmationStatus(
  id: string,
  now: Date = new Date()
): ConfirmationRequest | undefined {
  const request = confirmationRequests.get(id);
  if (!request) return undefined;
  expireIfNeeded(request, now);
  return snapshot(request);
}
