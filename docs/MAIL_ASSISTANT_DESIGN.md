# QUANT EXPERT Mail Assistant — Current Design

## 1. Product purpose

**QUANT EXPERT Mail Assistant** is the first Microsoft 365 assistant of the QUANT EXPERT AI Platform.

The current product is being built as a **read-first Mail Assistant**:

1. securely connect to the user's Microsoft mailbox;
2. read mail through Microsoft Graph via MCP;
3. analyze and classify the mail;
4. provide useful recommendations;
5. only later, through a separate controlled stage, introduce mailbox-changing operations.

The current work is **not** a continuation of another vendor's application or project. The active product identity is QUANT EXPERT Mail Assistant.

## 2. Current product identity

- Application: **QUANT EXPERT Mail Assistant**
- Client ID: **657cea31-052c-4e27-b97e-43a146ea72f0**
- Microsoft account: **quantexpert@outlook.com**
- Tenant: **consumers**
- MCP endpoint: **https://mcp-ms365.kvantexpert.ru/mcp**
- Transport: **Streamable HTTP**
- Preset: **mail**
- Access: **READ ONLY**

Current effective Graph permission boundary:

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

## 3. What the current system does

The current system already performs the complete technical connection:

    Mail Assistant / MCP Client
              |
              v
    HTTPS Streamable HTTP /mcp
              |
              v
         mcp-ms365
              |
              +---- mail read-only preset
              +---- OAuth identity
              +---- allowed read tools
              |
              v
      Microsoft Graph client
              |
              v
       Microsoft Graph API
              |
              v
       Outlook mailbox data

The first complete read-only E2E path has been verified.

## 4. Current E2E checkpoint

**MAIL-READ-E2E-PASSED**

Verified path:

    MCP E2E test
    → HTTPS /mcp
    → Microsoft Device Code OAuth
    → QUANT EXPERT application
    → quantexpert@outlook.com
    → OAuth access token
    → MCP initialize
    → tools/list
    → list-mail-messages
    → Microsoft Graph
    → real mailbox data

The test returned real mailbox messages and Microsoft Graph pagination metadata.

No mailbox write operation was performed.

This means the basic Microsoft 365 Mail data-plane connection is now a completed foundation, not the current development task.

## 5. Current development stage — Mail Intelligence

The active stage is **Mail Intelligence**.

The objective is to turn verified mail data into useful understanding without changing the mailbox.

The first read-only intelligence layer should analyze:

- subject;
- sender;
- received date/time;
- read/unread state;
- attachment presence;
- body preview;
- message metadata;
- topic;
- urgency;
- project reference;
- business context;
- suggested action.

Initial logical categories:

- Clients;
- Projects;
- Finance;
- Documents;
- Security;
- Automation;
- Personal.

The analysis result is informational/recommendational. It does not move, delete, send, rename, create or otherwise modify mail.

## 6. First Mail Intelligence scenario

The first concrete scenario should be deliberately small:

**Input**

    Показать последние письма

**Read layer**

    list-mail-messages

**Intelligence layer**

For each returned message:

1. identify the sender;
2. identify the subject/topic;
3. estimate urgency;
4. determine likely business/project context;
5. assign a logical category when evidence is sufficient;
6. produce a concise recommended next action.

**Output**

A structured human-readable summary such as:

    1. [Urgent] Client / Project X
       Sender: ...
       Subject: ...
       Why it matters: ...
       Recommended action: ...

    2. [Normal] Finance
       Sender: ...
       Subject: ...
       Recommended action: ...

No mailbox mutation is part of this scenario.

## 7. Intelligence architecture

The current architecture should remain separated into two layers:

    Microsoft 365 data layer
            |
            v
       mcp-ms365
            |
            v
      Read mail data
            |
            v
    Mail Intelligence layer
            |
      +-----+-----+
      |     |     |
      v     v     v

classify topic urgency
| | |
+-----+-----+
|
v
business/project context
|
v
recommendation
|
v
user / agent

The intelligence layer must not acquire additional Microsoft permissions merely to perform analysis of already-read data.

## 8. Identity and permission model

The project keeps these concepts separate:

1. Application Client ID;
2. Permission Catalog;
3. Preset Registry;
4. requested OAuth scopes;
5. granted token scopes;
6. OAuth authorization server;
7. MCP resource server;
8. Microsoft Graph.

A catalog entry is not evidence that a permission has been granted to the current token.

The current product identity is:

    QUANT EXPERT Mail Assistant
    Client ID: 657cea31-052c-4e27-b97e-43a146ea72f0
    Account: quantexpert@outlook.com

The historical Softeria identity and historical Client ID are not part of the current product.

Forbidden historical Client ID:

    084a3e9f-a9f4-43f7-89f9-d229cf97853e

## 9. Future mailbox organization

After Mail Intelligence is stable, the logical mailbox structure can be designed:

- Clients;
- Projects;
- Finance;
- Documents;
- Security;
- Automation;
- Personal;
- Archive.

Design comes before execution.

No mailbox folders are created during the current Mail Intelligence stage.

## 10. Controlled write boundary

Mailbox-changing operations are a separate future stage.

The future first controlled scenario may be:

1. create MCP-Test;
2. select one explicitly identified message;
3. move that one message;
4. verify;
5. audit.

This is **not enabled** by the current design.

Before any write operation:

- permissions must be reviewed;
- Microsoft consent must be explicit;
- the Graph adapter must be reviewed;
- execution must be explicitly enabled;
- confirmation must be required;
- the action must be audited;
- a new checkpoint must be created.

## 11. Security rules

- Use only QUANT EXPERT Mail Assistant.
- Use Client ID `657cea31-052c-4e27-b97e-43a146ea72f0`.
- Use `quantexpert@outlook.com` for the current mailbox.
- Do not restore the historical Softeria identity.
- Do not restore historical Client ID `084a3e9f-a9f4-43f7-89f9-d229cf97853e`.
- Do not use a default Client ID fallback.
- Do not enable `Mail.ReadWrite` for the current stage.
- Do not enable `Mail.Send`.
- Do not perform real mailbox writes.
- Do not add bulk automation.
- Do not mix Mail Intelligence with write execution.

## 12. Current next action

**Build the first Mail Intelligence read-only scenario on top of the already verified `list-mail-messages` data.**

The next implementation should focus on the analysis contract and output structure, not on Microsoft permission expansion and not on mailbox mutation.

[executed on device: mcp-ms365 (65080dd4-e76f-4d8e-8c2a-b0745624fbad)]