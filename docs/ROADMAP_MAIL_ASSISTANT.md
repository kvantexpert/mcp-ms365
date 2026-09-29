# Microsoft 365 AI Assistant Roadmap

## Current Stable Version

Checkpoint:

mcp-ms365-codex-mail-readonly-v1

Status:

- MCP server operational
- Codex MCP integration completed
- Microsoft Graph connection verified
- Mail readonly mode verified
- Git checkpoint created

## Current Permissions

Allowed:

- Mail.Read
- MailboxSettings.Read
- User.Read

Mode:

READ ONLY

Restrictions:

- no sending mail
- no deleting mail
- no modifying mailbox
- no write operations without separate approval

# Project Goal

Create a Microsoft 365 AI assistant capable of:

- understanding mailbox content
- organizing email information
- helping manage incoming communication
- creating structured email workflows

# Development Roadmap

## Phase 1 — Mail Assistant

Goal:

Transform basic email MCP access into an intelligent mail assistant.

Functions:

### Email Analysis

Capabilities:

- summarize incoming emails
- identify important emails
- identify emails requiring response
- analyze communication history

### Email Classification

Classification by:

Topics:

- clients
- projects
- finance
- documents
- security
- automation
- personal

Senders:

- group emails by sender
- track communication frequency
- identify important contacts

Content:

Analyze:

- keywords
- project references
- urgency
- business context

# Email Organization

## Folder Structure Management

Future capability:

Create mailbox structure for organized storage.

Example:

Inbox

Clients

Projects

Finance

Documents

Automation

Archive

Capabilities:

- create folders
- create subfolders
- maintain mailbox structure

# Email Sorting System

Future capability:

Automatically classify emails:

Example:

Invoice email:

Category:

Finance

Destination:

Finance/Invoices

Reason:

Contains financial keywords and sender matches supplier profile.

# Mail Rules Automation

Future capability:

Create rules:

Examples:

Client emails:

Client → Client folder

Invoices:

Finance → Invoices folder

Service notifications:

Automation folder

# Phase 2 — Controlled Write Mode

After Mail Assistant validation:

Enable carefully:

- create folders
- move messages
- create mailbox rules

Requires:

- new checkpoint
- new permissions review

# Phase 3 — Calendar Assistant

Functions:

- calendar reading
- daily planning
- meeting analysis

# Phase 4 — Files Assistant

Functions:

- OneDrive
- SharePoint
- document search
- document organization

# Phase 5 — Teams Assistant

Functions:

- Teams message analysis
- conversation summaries
- collaboration support

# Project Rules

Always:

- create checkpoint before major changes
- document changes
- keep permissions minimal
- separate read and write capabilities

Never:

- expand permissions without approval
- enable write operations automatically
- perform unrelated refactoring
- change architecture without plan

# Development Process

For every phase:

1. Create plan
2. Create branch
3. Implement only planned features
4. Test
5. Document
6. Commit
7. Create checkpoint tag
