# Microsoft 365 AI Assistant Roadmap

## Current Checkpoint

**MAIL-READ-E2E-PASSED**

Previous checkpoint name: `mcp-ms365-codex-mail-readonly-v1`. The name is historical. Codex is not part of the current connection architecture.

## Current Position

**Stage: Read-only Mail MCP verified and first E2E mail read passed. Next: Mail Intelligence.**

The verified deployment is:

- Application: QUANT EXPERT Mail Assistant
- Client ID: 657cea31-052c-4e27-b97e-43a146ea72f0
- Microsoft account: quantexpert@outlook.com
- Tenant: consumers
- MCP endpoint: https://mcp-ms365.kvantexpert.ru/mcp
- Transport: Streamable HTTP
- Preset: mail
- Access: READ ONLY

Expected effective Graph scopes:

- Mail.Read
- MailboxSettings.Read
- User.Read

## What Was Completed

### 1. MCP and Graph foundation

- MCP server deployed and operational.
- HTTPS endpoint configured through Nginx.
- Streamable HTTP endpoint verified.
- Microsoft Graph mail read access verified.
- Read-only mail profile established.

### 2. Own Microsoft application identity

Application:

QUANT EXPERT Mail Assistant

Client ID:

657cea31-052c-4e27-b97e-43a146ea72f0

Account:

quantexpert@outlook.com

The server-side device-code login succeeded and Microsoft consent was shown for mail read, mailbox settings read and profile read.

### 3. Client ID hardening

The previous implementation could fall back to a built-in public Client ID when MS365_MCP_CLIENT_ID was absent.

This is no longer allowed.

The current implementation requires:

MS365_MCP_CLIENT_ID

If it is absent, startup fails instead of silently selecting a default application identity.

### 4. Legacy identity cleanup

The old Softeria identity and historical Client ID:

084a3e9f-a9f4-43f7-89f9-d229cf97853e

are forbidden for the QUANT EXPERT deployment.

Legacy Softeria references were removed from the active repository.

Cleanup checkpoint:

adb51ce — chore: remove legacy Softeria references

### 5. Permission model clarification

The project now explicitly separates:

Application Client ID
Permission Catalog
Preset
Requested OAuth scopes
Granted token scopes

A permission appearing in a catalog is not proof that Microsoft granted it to the current token.

### 6. OAuth discovery

The public MCP server exposes protected-resource and authorization-server metadata.

Current advertised scopes:

- Mail.Read
- MailboxSettings.Read
- User.Read

The MCP resource is:

https://mcp-ms365.kvantexpert.ru/mcp

## Stage 3 — First E2E Mail Read

**Status: PASSED**

The complete path was executed successfully:

MCP E2E test
→ HTTPS /mcp
→ Microsoft Device Code OAuth
→ QUANT EXPERT application
→ quantexpert@outlook.com
→ OAuth access token
→ MCP initialize (HTTP 200)
→ tools/list
→ list-mail-messages
→ Microsoft Graph
→ real mailbox data

The test returned real messages from the mailbox and a Microsoft Graph `@odata.nextLink` for pagination.

Acceptance criteria:

1. OAuth succeeds for the QUANT EXPERT application. **PASS**
2. Microsoft account is quantexpert@outlook.com. **PASS**
3. MCP initialize succeeds. **PASS**
4. MCP tools are available. **PASS**
5. `list-mail-messages` succeeds. **PASS**
6. Mail data is returned through Microsoft Graph. **PASS**
7. No write operation occurs. **PASS**
8. Result is recorded as an E2E checkpoint. **PASS**

The temporary PowerShell/Node E2E script is a validation aid; it does not change the read-only permission boundary.

## What Was NOT Done

The following remain outside the current checkpoint:

- Mail.ReadWrite activation
- Mail.Send
- real mailbox writes
- creating mailbox folders
- moving messages
- deleting messages
- mailbox rules
- bulk organization
- automatic automation
- Calendar write
- Files write
- Teams write

No write operation is enabled by this roadmap update.

## Stage 4 — Mail Intelligence

**Status: NEXT**

Remain read-only.

Planned work:

- email classification;
- topic classification;
- sender analysis;
- urgency detection;
- project/business context;
- action recommendations.

The next implementation should consume already-verified mail read data and add analysis/orchestration logic without expanding Microsoft permissions.

## Stage 5 — Folder Structure Design

Design the logical mailbox structure:

- Clients
- Projects
- Finance
- Documents
- Security
- Automation
- Personal
- Archive

No mailbox folders are created during design.

## Stage 6 — Controlled Write Preparation

Blocked until a separate permission review and checkpoint.

The future first scenario is intentionally tiny:

1. create MCP-Test;
2. select one explicitly identified message;
3. move that one message;
4. verify;
5. audit.

This is planning only until separately approved.

## Stage 7 — Controlled Write

Requires:

- separate permission review;
- explicit Microsoft consent;
- real Graph adapter review;
- execution flag review;
- confirmation;
- audit;
- new checkpoint.

No automatic transition from read-only is allowed.

## Stage 8 — Automation

Only after controlled write validation:

- rule proposals;
- previews;
- confirmation;
- bounded execution;
- audit.

## Stage 9 — Other Assistants

After Mail Assistant stabilization:

- Calendar Assistant;
- Files Assistant;
- Teams Assistant;
- Tender/Procurement Assistant;
- Accountant Assistant.

Every assistant gets its own application identity, permission review, preset and checkpoint.

## Project Rules

Always:

1. plan;
2. implement;
3. test;
4. document;
5. checkpoint;
6. continue.

Never:

- restore the old Softeria identity;
- restore default Client ID fallback;
- infer granted scopes from the permission catalog;
- enable write operations without a separate checkpoint;
- revisit closed stages without a concrete regression;
- enable unrelated functionality.

## Current Next Action

**Do not change Microsoft permissions or enable write operations.**

Proceed to Stage 4 — Mail Intelligence, keeping the existing read-only boundary.
