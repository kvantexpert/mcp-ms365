import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  confirmAction,
  createConfirmationRequest,
  rejectAction,
} from '../src/lib/mail-action-confirmation.js';
import {
  executeAction,
  prepareExecution,
  validateWriteExecution,
} from '../src/lib/mail-execution-engine.js';
import {
  validateRequiredPermissions,
  getGrantedPermissionsFromAccessToken,
} from '../src/lib/write-permission-validation.js';
import type { MailActionProposal } from '../src/lib/mail-action-planner.js';

function proposal(): MailActionProposal {
  return {
    action: 'move-message',
    messageId: 'message-1',
    currentFolder: 'Inbox',
    targetFolder: 'MCP-Test',
    reason: ['test proposal'],
    status: 'preview',
  };
}

describe('write permission validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('blocks when only Mail.Read is granted', () => {
    expect(validateRequiredPermissions(['Mail.Read'])).toMatchObject({
      status: 'blocked',
      reason: 'required write permission missing',
    });
  });

  it('allows validation when Mail.ReadWrite is already granted', () => {
    expect(validateRequiredPermissions(['Mail.Read', 'Mail.ReadWrite'])).toMatchObject({
      status: 'allowed',
      reason: 'required write permission available',
    });
  });

  it('decodes granted delegated scopes from an existing JWT without requesting scopes', () => {
    const payload = Buffer.from(
      JSON.stringify({ scp: 'Mail.Read Mail.ReadWrite User.Read' })
    ).toString('base64url');
    expect(getGrantedPermissionsFromAccessToken(`header.${payload}.signature`)).toEqual([
      'Mail.Read',
      'Mail.ReadWrite',
      'User.Read',
    ]);
    expect(getGrantedPermissionsFromAccessToken('not-a-jwt')).toEqual([]);
  });

  it('blocks Graph adapter validation when Mail.ReadWrite is missing', () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    vi.stubEnv('WRITE_PERMISSION_REQUIRED', 'true');
    const confirmation = confirmAction(createConfirmationRequest(proposal()).id);

    expect(
      validateWriteExecution(confirmation.id, 'move-message', new Date(), ['Mail.Read'])
    ).toMatchObject({
      valid: false,
      reason: 'required write permission missing',
    });
  });

  it('blocks when WRITE_EXECUTION_ENABLED is false even if permission exists', () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'false');
    vi.stubEnv('WRITE_PERMISSION_REQUIRED', 'true');
    const confirmation = confirmAction(createConfirmationRequest(proposal()).id);

    expect(
      validateWriteExecution(confirmation.id, 'move-message', new Date(), ['Mail.ReadWrite']).valid
    ).toBe(false);
  });

  it('blocks an unapproved confirmation even if permission exists', () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    vi.stubEnv('WRITE_PERMISSION_REQUIRED', 'true');
    const confirmation = createConfirmationRequest(proposal());

    expect(
      validateWriteExecution(confirmation.id, 'move-message', new Date(), ['Mail.ReadWrite']).valid
    ).toBe(false);
  });

  it('blocks send-mail because it is outside the operation allowlist', () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    vi.stubEnv('WRITE_PERMISSION_REQUIRED', 'true');
    const confirmation = confirmAction(createConfirmationRequest(proposal()).id);

    expect(
      validateWriteExecution(confirmation.id, 'send-mail', new Date(), ['Mail.ReadWrite']).valid
    ).toBe(false);
  });

  it('blocks execution before Graph adapter selection when permission is absent', async () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    vi.stubEnv('WRITE_PERMISSION_REQUIRED', 'true');
    const confirmation = confirmAction(createConfirmationRequest(proposal()).id);
    const request = prepareExecution(confirmation.id);
    const result = await executeAction(request.id);

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('required write permission missing');
    expect(result.adapterResult).toBeNull();
  });

  it('blocks rejected confirmations despite granted permission', async () => {
    vi.stubEnv('WRITE_ADAPTER_MODE', 'graph');
    vi.stubEnv('WRITE_EXECUTION_ENABLED', 'true');
    vi.stubEnv('WRITE_PERMISSION_REQUIRED', 'true');
    const rejected = rejectAction(createConfirmationRequest(proposal()).id);
    const request = prepareExecution(rejected.id);

    expect(
      (await executeAction(request.id, new Date(), undefined, ['Mail.ReadWrite'])).status
    ).toBe('blocked');
  });
});
