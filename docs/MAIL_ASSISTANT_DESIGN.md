# Mail Assistant Design

## 1. Purpose

Create an AI assistant for a Microsoft 365 mailbox that works through the
existing MCP server and provides intelligent, read-only assistance with email.

The design covers:

- incoming email analysis;
- email search;
- classification and grouping;
- proposed mailbox storage structures;
- preparation for future, separately approved automation.

During Phase 1, analysis and recommendations do not change mailbox state.

## 2. Current Foundation

The project already has:

- the `mcp-ms365` server running over stdio;
- a Codex MCP integration;
- a verified Microsoft Graph connection to Exchange Online;
- a verified `mail-readonly` mode.

The current delegated Graph permissions are:

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

The stable configuration and end-to-end verification are documented in
[`CODEX_MCP_CONNECTION.md`](CODEX_MCP_CONNECTION.md) and
[`GRAPH_READ_CONFIRMED.md`](GRAPH_READ_CONFIRMED.md).

## 3. Architecture

```text
User
  |
  v
Codex
  |
  | MCP over stdio
  v
mcp-ms365 server
  |
  | MSAL delegated token
  v
Microsoft Graph API
  |
  v
Exchange Online mailbox
```

Codex interprets the user's request and calls the existing MCP read tools. The
server obtains a token from the existing MSAL cache and reads mailbox data
through Microsoft Graph. Codex performs analysis over the returned data and
shows summaries, classifications, and recommendations to the user. Phase 1
does not persist assistant classifications or modify the mailbox.

## 4. Mail Analysis Layer

### Email Summary

For selected messages, the assistant can:

- produce a concise summary;
- identify the main point;
- extract explicit actions, owners, and dates when present.

Summaries should distinguish facts stated in the message from inferred context
and should not invent missing actions or deadlines.

### Important Email Detection

The assistant can assess:

- urgency signals and stated deadlines;
- whether the message contains a question;
- whether a response appears necessary;
- whether the sender is important based on user-provided context or observed
  communication patterns.

Importance and response need are recommendations, not mailbox flags or
guaranteed facts. The assistant should explain the message signals behind a
recommendation.

### Conversation Analysis

For a requested conversation, the assistant can analyze:

- the available message history;
- participants and their stated roles;
- how the discussion and decisions changed over time;
- unresolved questions and next steps.

The analysis is limited to messages returned by the read tools and available to
the signed-in account.

## 5. Email Classification System

Classification is a proposed label with a short explanation and confidence
level. Ambiguous messages can receive multiple candidate labels or be marked
`Unclassified`; the assistant should not force a category.

### By Topic

Initial topics:

- Clients
- Projects
- Finance
- Documents
- Security
- Automation
- Personal

### By Sender

Read-only analysis can:

- group messages by sender;
- estimate communication frequency over the selected message set;
- identify frequent or potentially important contacts.

Contact importance should be presented as a signal for user review, not as a
permanent profile or authoritative ranking.

### By Content

Analysis can consider:

- keywords and phrases;
- project references;
- organizations and named entities;
- message type, such as an invoice, request, notification, or discussion;
- urgency and business context stated in the message.

Classification results remain in the response for Phase 1; they are not written
to message categories, folders, or other mailbox metadata.

## 6. Mail Organization System

The following is a proposed future structure, not a structure to create during
the current read-only phase:

```text
Inbox
├── Clients
├── Projects
├── Finance
├── Documents
├── Automation
└── Archive
```

Future organization capabilities may include:

- creating folders;
- creating nested folders;
- checking and maintaining an agreed folder structure.

Folder creation, renaming, moving, and other mailbox changes are out of scope
for this design phase and must not be invoked through the current configuration.

## 7. Automatic Sorting Concept

Sorting is a future recommendation workflow. In Phase 1, the assistant can
explain a proposed destination but does not move the message.

```text
Invoice from supplier
  -> Category: Finance
  -> Proposed folder: Finance/Invoices

Client email
  -> Category: Clients
  -> Proposed folder: Clients/ClientName
```

Each recommendation should provide its reason, such as financial terms and a
known supplier signal, or a client/project reference in the message. Uncertain
matches should be sent to the user for review instead of being treated as
automatic decisions.

## 8. MCP Tools Required

### Read operations for Phase 1

Use the existing tools:

- `list-mail-messages` for searching and selecting messages;
- `get-mail-message` for analyzing a selected message or conversation;
- `list-mail-folders` for mailbox structure context.

The tools must remain constrained by the configured `mail-readonly` preset.

### Future write operations

Potential operations for a later, separately approved phase:

- `create-mail-folder`;
- `move-mail-message`;
- `create-mail-rule`.

These names describe planned capabilities and are not asserted to be available
in the current server configuration. Any write operation requires a separate
checkpoint, implementation plan, and permissions review before enablement.

## 9. Security Model

Current mode: **READ ONLY**.

`Mail.Read` supports the Phase 1 message analysis. The current connection also
uses `MailboxSettings.Read` and `User.Read`; no additional scopes are proposed
here.

Not allowed in the current phase:

- sending mail;
- deleting mail;
- modifying mailbox data;
- creating folders or rules;
- moving messages or invoking other write operations.

Mailbox changes require a separate explicit approval and a reviewed design.
Message content should only be retrieved as needed for the user's request, and
reports should avoid exposing unnecessary personal or mailbox data.

## 10. Development Phases

### Phase 1 — Read-only Mail Intelligence

Build and validate analysis, search, classification, grouping, and proposed
sorting recommendations without changing mailbox state or adding permissions.

### Phase 2 — Controlled Mailbox Organization

Consider limited folder and message organization only after Phase 1 validation,
a separate design review, and a new checkpoint and permissions review.

### Phase 3 — Automation Rules

Consider mailbox rule creation only after a separate risk review and explicit
approval. Rule behavior must be reviewable before activation.

Each phase uses a separate branch, tests, documentation, and a checkpoint tag.

## 11. Next Implementation Steps

After this design is approved:

1. Create the `feature/mail-assistant` branch from the current stable
   checkpoint.
2. Implement only the first Phase 1 capability: email classification.
3. Add tests for topic labels, explanations, confidence, and ambiguous or
   unclassified messages.
4. Keep the implementation read-only and use only the current permissions.
5. Document the behavior, run the planned checks, commit the work, and create a
   checkpoint tag.
