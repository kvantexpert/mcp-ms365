# Mail Action Confirmation

## Purpose

The action confirmation manager tracks a user's decision about a dry-run mail
organization proposal. It changes only local in-memory confirmation state. An
approved proposal is not executed in this phase.

## Request Model and Statuses

Each `ConfirmationRequest` contains a UUID, a copied action proposal, status,
creation time, decision timestamps, and an expiry time. New requests start as
`pending` and expire after 15 minutes by default.

Statuses:

- `pending`: awaiting a decision;
- `approved`: the proposal was approved, but no operation was performed;
- `rejected`: the proposal was rejected;
- `expired`: the pending request passed its expiry time without a decision.

Terminal states do not change to another decision. Confirming or rejecting an
expired request leaves it expired. Unknown request IDs return no value from
`getConfirmationStatus` and cause decision functions to throw.

## Workflow

```text
Email
  ↓
Classification
  ↓
Action Planner
  ↓
Preview
  ↓
Confirmation Layer
  ↓
Approved / Rejected / Expired
```

The module exports `createConfirmationRequest`, `confirmAction`,
`rejectAction`, and `getConfirmationStatus`. The
`preview-mail-action-confirmation` MCP utility creates a pending local request
from the supplied preview proposal and displays the action, target, reason,
and status. It does not provide an MCP approval or rejection operation.

## Safety

The manager accepts only proposals in `preview` state. Its module has no Graph
client dependency. Approval only changes the request status to `approved` and
sets `confirmedAt`; rejection only changes the status to `rejected` and sets
`rejectedAt`. Neither decision calls `move-mail-message`,
`create-mail-folder`, `create-mail-rule`, nor any Graph write API.

The MCP utility is marked read-only and closed-world and is scoped to the mail
preset. Its only state change is a pending request in process memory. Requests
are not durable and are lost when the server restarts. This phase has no
execution component, so approval cannot modify the mailbox.

OAuth, existing Graph permissions, and scopes are unchanged. No write
operations are added by this phase.
