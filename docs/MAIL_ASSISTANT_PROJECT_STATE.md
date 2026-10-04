# Mail Assistant Project State

## Current checkpoint

**MAIL-READ-E2E-PASSED**

Previous checkpoint name: `mcp-ms365-codex-mail-readonly-v1`. The name is historical. Codex is not a required component of the current architecture.

## Product

QUANT EXPERT Mail Assistant

## Microsoft identity

- Client ID: 657cea31-052c-4e27-b97e-43a146ea72f0
- Account: quantexpert@outlook.com
- Tenant: consumers

## MCP runtime

- Endpoint: https://mcp-ms365.kvantexpert.ru/mcp
- Transport: Streamable HTTP
- Preset: mail
- Access: READ ONLY

## Expected Graph scopes

- Mail.Read
- MailboxSettings.Read
- User.Read

## Completed

- MCP server deployed and operational.
- HTTPS endpoint and Streamable HTTP verified.
- Microsoft Graph mail read access verified.
- Own QUANT EXPERT Microsoft application created and used successfully.
- Server-side device-code login completed.
- Client ID fallback removed; MS365_MCP_CLIENT_ID is mandatory.
- Legacy Softeria identity removed from active repository.
- Historical Client ID 084a3e9f-a9f4-43f7-89f9-d229cf97853e is forbidden.
- Repository branding and deployment references cleaned.
- GitHub SSH push from server verified.
- First complete read-only E2E test passed.

## E2E result

The verified path is:

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

The test returned real mailbox messages and Microsoft Graph pagination metadata (`@odata.nextLink`).

No write operation was performed.

## Architecture clarification

The following are separate concepts:

1. Application Registry;
2. Permission Catalog;
3. Preset Registry;
4. Requested OAuth scopes;
5. Granted token scopes;
6. OAuth authorization server;
7. MCP resource server;
8. Microsoft Graph.

A catalog entry is not evidence of a granted permission.

## Not enabled

- Mail.ReadWrite;
- Mail.Send;
- mailbox writes;
- folder creation;
- message movement;
- deletion;
- mailbox rules;
- bulk organization;
- automation.

## Next gate

**Stage 4 — Mail Intelligence**

The next work remains read-only:

- classification;
- topic detection;
- sender analysis;
- urgency;
- project/business context;
- action recommendations.

No Microsoft permission expansion is part of this step.

## Project relationship

mcp-ms365 is the Microsoft 365 data-plane integration of the larger QUANT EXPERT AI Platform.

project-control is the central project/control-plane repository.

Technical implementation stays in mcp-ms365. Architecture, status, roadmap and cross-project planning are mirrored in project-control.

## Rules

- Do not restore Softeria.
- Do not restore default Client ID fallback.
- Do not enable write functions.
- Do not expand permissions.
- Do not revisit closed stages without a concrete regression.
- Keep the next action limited to read-only Mail Intelligence.
