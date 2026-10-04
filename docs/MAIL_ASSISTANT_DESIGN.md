# QUANT EXPERT Mail Assistant — Design

## 1. Product purpose

Mail Assistant is the first Microsoft 365 assistant of the QUANT EXPERT AI Platform.

The first objective is safe mailbox understanding through Microsoft Graph. Mailbox mutation is a separate future capability.

## 2. Current boundary

Application: QUANT EXPERT Mail Assistant

Client ID: 657cea31-052c-4e27-b97e-43a146ea72f0

Account: quantexpert@outlook.com

MCP: https://mcp-ms365.kvantexpert.ru/mcp

Transport: Streamable HTTP

Preset: mail

Access: READ ONLY

Graph scopes:

- Mail.Read
- MailboxSettings.Read
- User.Read

## 3. Logical architecture

    AI Assistant / MCP Client
              |
              v
        MCP HTTP endpoint
              |
              v
         mcp-ms365
              |
              +---- preset: mail-readonly
              |
              +---- tool allowlist
              |
              +---- OAuth identity
              |
              v
      Microsoft Graph client
              |
              v
       Microsoft Graph API
              |
              v
          Outlook data

## 4. Identity architecture

The Application Registry identifies the Microsoft application.

The Permission Catalog describes available Graph permissions.

The Preset Registry describes the safe operational profile.

The OAuth token contains the actual granted delegated scopes.

These four objects must never be treated as interchangeable.

## 5. Mail intelligence

After the first E2E read is accepted, the assistant may analyze:

- subject;
- sender;
- received date;
- body preview;
- message metadata;
- topics;
- urgency;
- project references;
- business context;
- suggested actions.

Initial classification categories:

- Clients;
- Projects;
- Finance;
- Documents;
- Security;
- Automation;
- Personal.

The result is an analysis/recommendation and does not change the mailbox.

## 6. Future organization model

The logical mailbox structure may contain:

- Clients;
- Projects;
- Finance;
- Documents;
- Security;
- Automation;
- Personal;
- Archive.

Design precedes execution.

## 7. Controlled write boundary

Future write operations require a separate stage.

Initial proposed scenario:

1. create MCP-Test;
2. select one explicitly identified message;
3. move that message;
4. verify;
5. audit.

The scenario is not enabled by this document.

## 8. Security rules

- no Softeria identity;
- no historical Client ID 084a3e9f-a9f4-43f7-89f9-d229cf97853e;
- no default Client ID fallback;
- no Mail.ReadWrite in the current read-only profile;
- no Mail.Send;
- no real mailbox write;
- no bulk automation;
- every write requires separate review and checkpoint.

## 9. Current next step

First E2E read-only request through MCP Inspector:

Покажи последние письма

Acceptance requires evidence that the response travelled through MCP and Microsoft Graph without any write operation.
