# Controlled Write Mode

## Purpose

`mail-write-controlled` is a separate experimental preset that exposes only the mail folder creation and single-message move Graph tools for controlled-write preparation. It is not enabled by default. Selecting the preset does not execute an operation; selecting it for a login may cause the server to derive the permission required by its enabled tools, so do not start login or consent without a separately approved permission transition.

## Separation

- `mail-readonly` continues to use the mail tool set in read-only mode with authentication tools disabled. Graph write endpoints are not registered in that mode.
- `mail-write-controlled` filters the tool set to the `controlled-write` category and disables authentication tools. Its tools return a preview/block result in the current implementation; they do not call Graph.

The existing `mail-readonly` definition and behavior are unchanged.

## Allowed Actions

The experimental tool allowlist contains only:

- `create-mail-folder`
- `move-mail-message`

These tools are present for planning and guard validation only. The current execution engine supports a `move-message` proposal and does not yet model an approved folder-creation proposal.

## Disabled Actions

The controlled preset does not include:

- sending mail;
- deleting messages;
- creating or updating mail rules;
- updating messages;
- bulk sorting or bulk moves.

## Safety

- `WRITE_EXECUTION_ENABLED` is false unless explicitly set to the literal string `true`.
- `WRITE_ADAPTER_MODE` defaults to `mock`; `graph` selects an unimplemented placeholder only.
- The execution eligibility check requires the flag, an approved confirmation, and an allowlisted action.
- In this preparation phase, `executeAction` uses the local mock adapter by default when the eligibility flag is true and the confirmation is approved. In `graph` mode the placeholder returns `not-implemented`. Neither mode invokes Graph.
- Direct calls to the two exposed Graph write tools also return a blocked planning response; there is no path to a Graph write API in this phase.
- A future implementation requires explicit confirmation, durable audit, result verification, rollback planning, and a separate permission transition/checkpoint.
