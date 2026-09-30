# Next Agent Instructions

Current branch: `feature/mail-organization-write`

Current status: The Section 1 foundation implementation is complete, but its final permission activation gate is not. Phase 1.3.9.7, Fresh Permission Activation, remains pending after the latest validation found extra cached scope metadata and no verifiable `scp` claim.

Read `docs/MAIL_ASSISTANT_PROJECT_STATE.md`, `docs/ROADMAP_MAIL_ASSISTANT.md`, and the permission/OAuth result documents before continuing.

Do not repeat completed work on:

- email classification;
- action planning and dry-run;
- confirmation and mock execution foundations;
- OAuth token diagnostics and local cache reset.

Continue from the pending permission investigation. The latest `diagnose-permissions` result is recorded in `docs/PERMISSION_ACTIVATION_FINAL_RESULT.md`. Do not repeat consent or change application configuration/scopes without an explicit user request. Verify actual token permissions; preset requirements and cached target metadata are not proof of granted scopes.

The first future Section 2 action is to create the `MCP-Test` folder, but only after minimal permission activation is verified, the real Graph write path has been reviewed and enabled in a separate stage, and the user explicitly confirms the operation. Then move only one specifically selected message from `Inbox` to `MCP-Test` and verify/audit the result.

Never perform bulk message moves or mailbox automation without a separate plan, explicit confirmation, validation, and audit.
