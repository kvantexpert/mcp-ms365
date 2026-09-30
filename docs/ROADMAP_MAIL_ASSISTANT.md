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

# Phase 1.1 — Email Classification Foundation

## Goal

Создать первый безопасный слой Mail Assistant для анализа писем без изменения mailbox.

Принцип:

READ ONLY ONLY

На этом этапе агент только анализирует письма и создаёт классификацию.

## Development Branch

Перед реализацией создать отдельную ветку:

`feature/mail-assistant`

Ветка должна создаваться от стабильного состояния:

`mcp-ms365-codex-mail-readonly-v1`

Цель:

- не нарушить рабочий MCP;
- сохранить стабильную версию;
- вести разработку Mail Assistant отдельно.

## Phase 1.1 Functionality

Первая реализуемая функция:

Email Classification

Входные данные — Microsoft Graph mailbox data:

- `subject`
- `sender`
- `receivedDateTime`
- `bodyPreview`
- message metadata

Источники MCP:

- `list-mail-messages`
- `get-mail-message`

## Classification Logic

### Topic Classification

Категории:

- Clients
- Projects
- Finance
- Documents
- Security
- Automation
- Personal

### Sender Classification

Определять:

- отправителя;
- организацию;
- частоту коммуникации;
- важность контакта.

### Content Classification

Анализ:

- ключевые слова;
- тему письма;
- проект;
- срочность;
- наличие действий.

## Output Format

На первом этапе результат только аналитический.

Пример:

```text
Email:
Invoice September

Classification:
Category: Finance

Reason:
- contains invoice keywords
- sender matches supplier pattern

Suggested destination:
Finance/Invoices
```

Это только рекомендация. Никаких изменений mailbox.

## Restrictions

Phase 1.1 НЕ включает:

- создание папок;
- перемещение писем;
- создание правил;
- отправку писем;
- изменение mailbox.

Write-функции будут отдельным этапом.

## Next Steps After Phase 1.1

После успешной классификации:

- **Phase 1.2:** Folder Structure Design
- **Phase 1.3:** Controlled Mail Organization
- **Phase 1.4:** Automation Rules

Каждый этап требует отдельной проверки, документации и checkpoint.

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

# Phase 1.2 — Folder Structure Design

## Goal

Создать архитектуру хранения писем после завершения read-only анализа.

Принцип:

Сначала проектирование структуры.

Создание и изменение папок будут отдельным этапом после подтверждения архитектуры и отдельного checkpoint.

## Phase 1.3.2 — Confirmation Layer

Status: **Completed**

Confirmation requests can be created and set to `approved`, `rejected`, or `expired`. Approval changes only local in-memory state; execution remains unavailable. No Graph write operation is performed.

## Phase 1.3.3 — Controlled Execution Engine Foundation

Status: **Completed**

The execution engine foundation is implemented in SAFE MODE. It prepares and audits requests but blocks execution; it does not call Microsoft Graph write APIs. The project remains **READ ONLY**.

## Phase 1.3.4 — First Controlled Write

Status: **Permission Preparation**

The proposed first controlled scenario is to create the `MCP-Test` folder and move one explicitly selected message from `Inbox` to that folder. This remains planning only until permissions are reviewed, a separate checkpoint and tests are completed, and the user explicitly approves the write operation. No consent or Graph write operation is performed in the permission preparation stage.

## Phase 1.3.5 — Controlled Write Mode Preparation

Status: **Implementation**

Prepare the opt-in `mail-write-controlled` preset with only the `create-mail-folder` and `move-mail-message` tools. `WRITE_EXECUTION_ENABLED` defaults to false. The execution engine remains mock-only and direct Graph write tool calls remain blocked; no permission transition or Graph adapter is enabled.

## Phase 1.3.6 — First Controlled Write Execution

Status: **Completed (Mock Only)**

The isolated adapter interface exercises `create-folder` and `move-message` through a mock adapter only. It validates the feature flag, approved confirmation, and operation allowlist. No Graph write client is connected and no mailbox state is changed.

## Phase 1.3.7 — Real Graph Write Adapter Preparation

Status: **Implementation**

Add the adapter factory and a Graph adapter placeholder that returns `not-implemented`. The factory defaults to mock mode. No Graph client, write API, permission transition, or mailbox change is enabled in this phase.

## Phase 1.3.8 — Permission Activation Preparation

Status: **Completed**

Add a fail-closed check for the already-granted `Mail.ReadWrite` permission before Graph adapter selection. This phase only reads existing token claims; it does not request scopes, start login or consent, or connect a Graph write API.

## Phase 1.3.9 — First Controlled Write

Status: **Permission Activation Pending**

The proposed first test remains limited to creating `MCP-Test` and moving one explicitly selected message. It requires separately approved permission activation, a new checkpoint, and the Graph write adapter implementation. No write action is enabled by this roadmap update.

## Phase 1.3.9.3 — Permission Cleanup Preparation

Status: **Implementation**

Add local diagnostics that compare the minimal expected mail scopes with scope metadata from the existing token cache. Report whether scopes came from a decoded access-token `scp` claim or only from MSAL cache request metadata. This phase does not revoke consent, change app registration or scopes, start login, or modify the mailbox. Phase 1.3.9 remains **Permission Activation Pending**.

## Phase 1.3.9.4 — Consent Reset + Clean Activation Preparation

Status: **Preparation**

Document a safe local token/account cache reset procedure and provide a preview-only cache inventory. No cache deletion, consent revocation, login, permission change, or Graph call occurred in this phase. Phase 1.3.9 remains **Permission Activation Pending**.

## Phase 1.3.9.5 — Clean OAuth State Reset

Status: **Completed**

The confirmed local reset removed the token-cache and selected-account records. It preserved the cache-encryption key. Post-reset diagnostics reported no cached account and no access tokens. Microsoft consent was not revoked and permissions were not changed. See `docs/OAUTH_STATE_RESET_EXECUTION_RESULT.md`.

## Phase 1.3.9.6 — Execute OAuth State Reset

Status: **Completed**

The cache reset completed after the guarded pre-deletion inventory could inspect both the local filesystem and OS credential store. No Graph API call or mailbox change occurred.

## Phase 1.3.9.7 — Fresh Permission Activation

Status: **Pending**

The next activation attempt must request only the reviewed scopes and verify the actual returned permissions. This status does not authorize starting device login or Microsoft consent.

## Phase 1 Review

Status: **Completed**

The Phase 1 architecture and implementation review is documented in `docs/MAIL_ASSISTANT_PHASE1_COMPLETE_REVIEW.md`. This review does not change the Phase 1.3.9 status: permission activation is still pending, and the project remains mock-only with no mailbox changes.

# Project Sections

## Section 1 — Mail Assistant Foundation

Status: **Completed**

The foundation includes MCP and Graph read integration, deterministic email classification, folder and action planning, dry-run, confirmation, mock execution, permission validation, OAuth diagnostics, and the verified local OAuth state reset. No live mailbox write has been performed. Phase 1.3.9.7 remains pending before any real write work.

## Section 2 — Mail Organization Engine

Status: **Ready after permission activation**

The next planned work is the single-folder and single-message controlled scenario, followed by bounded organization proposals and later automation planning. Begin only after minimal permission activation is verified, the Graph write path has its own review/checkpoint, and the user confirms the specific action. See `docs/MAIL_ASSISTANT_PROJECT_STATE.md` and `docs/NEXT_AGENT_INSTRUCTIONS.md`.
