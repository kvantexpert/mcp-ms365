# Mail Assistant Roadmap

**Repository:** `kvantexpert/mcp-ms365`
**Product:** Mail Assistant
**Phase:** Phase 1 — Read-Only
**Current checkpoint:** `mcp-ms365-codex-mail-readonly-v1`
**Status:** IN PROGRESS

# 0. ТОЧКА ВОССТАНОВЛЕНИЯ

Если контекст потерян, сначала открыть:
```text
docs/ROADMAP_MAIL_ASSISTANT.md
docs/MAIL_ASSISTANT_DESIGN.md
```

Команда:
> Открой docs/ROADMAP_MAIL_ASSISTANT.md и docs/MAIL_ASSISTANT_DESIGN.md. Продолжи работу с текущего checkpoint. Не пересматривай закрытые этапы.

# 1. ЗАФИКСИРОВАННЫЙ ПЛАН

## Шаг 1 — Анализ почты
- [ ] Сводки входящих
- [ ] Важные письма
- [ ] Письма, требующие ответа
- [ ] История переписки

## Шаг 2 — Классификация
- [ ] Клиенты
- [ ] Проекты
- [ ] Финансы
- [ ] Документы
- [ ] Безопасность
- [ ] Автоматизация
- [ ] Личные
- [ ] Анализ отправителей
- [ ] Анализ содержания

## Шаг 3 — Структура хранения
```text
Inbox
├── Клиенты
├── Проекты
├── Финансы
├── Документы
├── Автоматизация
└── Архив
```

На Phase 1 только proposal.

## Шаг 4 — Автоматическая сортировка
Пока только proposal. Примеры:
- `Invoice → Финансы/Счета`
- `Клиент X → Клиенты/X`
- `Project Y → Проекты/Y`

## Шаг 5 — Write
Отдельный checkpoint: `mcp-ms365-mail-write-v1`.
Перед ним: permissions review, отдельный этап/ветка, тесты, документация и E2E.

# 2. ЧТО УЖЕ СДЕЛАНО

## Server
- [x] mcp-ms365 развернут;
- [x] systemd service;
- [x] service enabled/active;
- [x] Node.js v24.21.0;
- [x] `--preset mail`;
- [x] `--read-only`;
- [x] `127.0.0.1:3000`;
- [x] public URL.

## HTTPS
- [x] DNS `mcp-ms365.kvantexpert.ru`;
- [x] Nginx;
- [x] reverse proxy;
- [x] HTTPS/Let's Encrypt.

## MCP
- [x] Streamable HTTP;
- [x] `/mcp` endpoint;
- [x] OAuth protection;
- [x] protected-resource discovery;
- [x] authorization-server discovery.

## Inspector
- [x] Windows Node v24.19.0;
- [x] найден обход PowerShell policy через `npx.cmd`;
- [x] Inspector запущен;
- [x] правильный URL определён.

# 3. НЕ ПУТАТЬ С DEMO

В Inspector есть `filesystem-server-default`, `everything-server-default`, `example-server-default`.
`example-server-default` — demo.

Наш URL:
`https://mcp-ms365.kvantexpert.ru/mcp`

Если появляется `example-server.modelcontextprotocol.io`, это неправильный сервер.

# 4. CURRENT BLOCKER — MICROSOFT OAUTH

Inspector фактически отправляет:
```text
client_id=084a3e9f-a9f4-43f7-89f9-d229cf97853e
redirect_uri=http://127.0.0.1:6274/oauth/callback
scope=Mail.Read MailboxSettings.Read User.Read offline_access
response_type=code
code_challenge_method=S256
```

Microsoft отвечает:
```text
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid.
The expected value is a URI which matches a redirect URI registered for this client application.
```

## Диагноз
OAuth flow доходит до Microsoft. Текущий blocker — Redirect URI Microsoft App Registration.

Client ID:
`084a3e9f-a9f4-43f7-89f9-d229cf97853e`

Фактический Inspector callback:
`http://127.0.0.1:6274/oauth/callback`

## Следующий шаг
В Microsoft Entra / App Registration открыть Authentication и проверить/добавить:
`http://127.0.0.1:6274/oauth/callback`

Затем:
1. Connect в Inspector;
2. Microsoft login;
3. consent при необходимости;
4. callback;
5. token;
6. MCP session;
7. mail read tool.

# 5. ЧТО НЕ СЧИТАЕТСЯ ЗАВЕРШЁННЫМ

OAuth нельзя считать завершённым, пока MCP session реально не установлена.
Mail Assistant нельзя считать работающим, пока не выполнен первый реальный mail read E2E.

Старый ручной OAuth client с callback `http://localhost:8000/callback` — отдельный тест, не callback Inspector.

# 6. СЛЕДУЮЩИЕ CHECKPOINTS

## `mcp-ms365-codex-mail-inspector-oauth-v1`
Условия: Inspector OAuth завершён, token получен, MCP session установлена, mail tools видны.

## `mcp-ms365-mail-analysis-v1`
Условия: последние письма, normalization, summary, important, needs-reply, history.

## `mcp-ms365-mail-classification-v1`
Условия: категории, sender analysis, reason/confidence.

## `mcp-ms365-mail-organization-proposal-v1`
Условия: proposal структуры и правил без изменения mailbox.

## `mcp-ms365-mail-write-v1`
Только после permissions + tests + documentation + отдельного решения.

# 7. ЖЁСТКИЕ ОГРАНИЧЕНИЯ ДО WRITE

Не включать:
- Mail.ReadWrite;
- Mail.Send;
- move;
- delete;
- create folder;
- rules;
- categories;
- reply/forward;
- любые mailbox write actions.

Не перескакивать к Orchestrator до самостоятельного read-only E2E.

# 8. КОМАНДА ВОССТАНОВЛЕНИЯ

Скопировать в новый чат:
> Открой docs/ROADMAP_MAIL_ASSISTANT.md и docs/MAIL_ASSISTANT_DESIGN.md. Продолжи работу с текущего checkpoint. Сейчас checkpoint `mcp-ms365-codex-mail-readonly-v1`; текущий blocker — Microsoft OAuth redirect URI для MCP Inspector `http://127.0.0.1:6274/oauth/callback`. Не пересматривай закрытые этапы и не переходи к write-функциям. Следующий шаг — исправить redirect URI в Microsoft App Registration, затем завершить OAuth и выполнить первый mail read E2E.

# 9. КРАТКАЯ ТОЧКА

```text
CHECKPOINT: mcp-ms365-codex-mail-readonly-v1
PHASE: Phase 1 — Mail Assistant Read-Only
SERVER: https://mcp-ms365.kvantexpert.ru/mcp
TRANSPORT: Streamable HTTP
MODE: --preset mail --read-only
SCOPES: Mail.Read, MailboxSettings.Read, User.Read
INSPECTOR: launched
BLOCKER: Microsoft OAuth redirect URI
CLIENT ID: 084a3e9f-a9f4-43f7-89f9-d229cf97853e
CALLBACK: http://127.0.0.1:6274/oauth/callback
NEXT: register/check callback in Microsoft App Registration → repeat OAuth → establish MCP session → first mail read
DO NOT: write permissions, write tools, Orchestrator integration
```