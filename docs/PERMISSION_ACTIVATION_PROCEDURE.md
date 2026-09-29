# Permission Activation Procedure

## 1. Current State

Current Microsoft Graph permissions:

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

Current mode: **READ ONLY**. No write permission has been added or consented to.

## 2. Target State

The proposed additional delegated permission is `Mail.ReadWrite`, required for the future folder creation and message move scenario. This is a proposal only; it is not requested or granted by this procedure.

## 3. Scope Limitation

If a later, separately approved transition activates the permission, the intended operations remain limited to:

- `create-mail-folder` for the reviewed test folder;
- `move-mail-message` for one explicitly selected message.

The following remain out of scope:

- `send-mail`;
- `delete-mail-message`;
- mail rules;
- bulk operations.

## 4. Consent Checklist

Before accepting a future Microsoft consent prompt, verify:

- the application name is the expected mcp-ms365 application;
- the permission list contains only the expected permissions for the reviewed test;
- no unrelated Microsoft Graph scopes are present;
- no Teams, Files, or Calendar permissions are present.

Stop and do not accept if the prompt differs from the reviewed permission set. This document does not initiate or authorize consent.

## 5. Post Consent Validation

Only after separately approved consent and login, run `verify-login` and `list-permissions`. Confirm that `Mail.ReadWrite` appears among the permissions actually granted. The runtime write gate independently checks the existing access token's delegated `scp` claim and blocks when `Mail.ReadWrite` is absent; it does not request permission or trigger login.

## 6. Rollback

If a future approved transition fails:

- remove only the credentials issued for the reviewed test, using the documented token-cache procedure;
- restore the read-only preset and configuration;
- use the checkpoint created for that transition.

No credentials are removed and no configuration is changed in this preparation phase.

## 7. First Write Test

The later test is bounded to creating `MCP-Test` and moving one selected message from `Inbox` to `MCP-Test`. It requires separate approval and a new checkpoint. No folder creation or message move is performed here.
