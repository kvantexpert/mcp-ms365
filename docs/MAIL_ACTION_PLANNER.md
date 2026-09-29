# Mail Action Planner

## Purpose

The mail action planner creates a proposed organization action for a supplied
message. It is a dry-run layer for Phase 1.3.1 and does not perform the
proposed action.

## Architecture

The `preview-mail-organization` MCP utility receives message metadata, applies
the existing local mail classifier, and passes the classification and folder
rules to `src/lib/mail-action-planner.ts`. The planner returns an action
proposal for display. It does not use the Graph client.

```text
Supplied message fields
        ↓
Local mail classification
        ↓
Folder structure rules
        ↓
Action proposal (preview only)
```

## Input

The utility accepts:

- `messageId`: message identifier;
- `subject`, `sender`, `senderEmail`, `bodyPreview`, and `receivedDateTime`:
  fields used by the existing classifier;
- `currentFolder`: optional known folder display name.

The planner accepts the message identifier, subject, optional current folder,
classification result, and optional folder structure rules. It makes no Graph
request to retrieve missing information.

## Output

The planner returns an `Action Proposal` containing:

- `action`: `move-message`, describing a future action only;
- `messageId`;
- `currentFolder`, or `null` when not supplied;
- `targetFolder`;
- `reason`;
- `status`: `preview`.

The MCP utility also displays the classification, `DRY RUN` mode, and the
message `No changes performed.` For example, an invoice classified as Finance
can produce a proposal for `Finance/Invoices`. A subject such as `Project
Alpha meeting` with the standard project folder rule produces
`Projects/Project Alpha`.

## Dry-run Principle

The proposal is data for review, not an executable command. The planner is a
pure local function and the utility does not access its Graph client. Preview
generation does not move messages, create folders, create rules, or update any
mailbox state.

## Read-only Guarantee

`preview-mail-organization` is marked read-only and closed-world and is scoped
to the `mail` preset, which includes `mail-readonly`. It only processes
message fields supplied by the caller. The existing `mail-readonly` Graph
permissions remain unchanged. No Graph write API or write operation is added
by this phase.
