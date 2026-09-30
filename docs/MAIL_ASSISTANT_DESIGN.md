# Mail Assistant Design

**Project:** `kvantexpert/mcp-ms365`
**Phase:** Phase 1 — Mail Assistant (Read-Only)
**Checkpoint:** `mcp-ms365-codex-mail-readonly-v1`
**Document:** `docs/MAIL_ASSISTANT_DESIGN.md`

## 1. Назначение

Mail Assistant — AI-ассистент поверх Microsoft 365 / Microsoft Graph и MCP-сервера `mcp-ms365`.

Цель Phase 1 — безопасно работать с почтой в режиме **read-only**:
- получать письма;
- анализировать входящие;
- определять важные сообщения;
- определять письма, требующие ответа;
- строить историю переписки;
- анализировать отправителей и содержание;
- классифицировать письма;
- предлагать организацию почты.

**На этом этапе ассистент не изменяет почтовый ящик.**

## 2. Граница Phase 1

Разрешено: чтение сообщений и метаданных, анализ, группировка, поиск связанных сообщений, классификация, summary и рекомендации.

Запрещено до `mcp-ms365-mail-write-v1`: перемещение, удаление, создание/переименование папок, категории, правила, отправка, reply/forward и любые write-операции.

## 3. Архитектура

```text
User
  ↓
Mail Assistant
  ↓
MCP Client
  ↓
mcp-ms365
  ↓
Microsoft Graph
  ↓
Outlook Mail
```

Pipeline:
```text
Graph → mcp-ms365 Mail Read-Only → получение → нормализация → анализ
                                                ↓
                         Summary / Important / Needs Reply / History
                                                ↓
                                           Classification
                                                ↓
                                      Organization Proposal
```

## 4. Функции Phase 1

### Анализ почты
- сводки входящих;
- важные письма;
- письма, требующие ответа;
- история переписки;
- поиск по отправителю/теме/содержанию.

### Классификация
Базовые категории:
- Клиенты
- Проекты
- Финансы
- Документы
- Безопасность
- Автоматизация
- Личные

Дополнительно анализируются отправитель, содержание, признаки важности, причина классификации и confidence.

### Proposal организации
Целевая логическая структура:
```text
Inbox
├── Клиенты
├── Проекты
├── Финансы
├── Документы
├── Автоматизация
└── Архив
```

Примеры: `Invoice → Финансы/Счета`, `Клиент X → Клиенты/X`.
Proposal не является действием. Реальные изменения только после write checkpoint.

## 5. Нормализованная модель сообщения

Минимальные поля:
```text
message_id
conversation_id
internet_message_id
subject
from
to
cc
received_at
sent_at
body
body_preview
importance
has_attachments
attachments_metadata
web_link
parent_folder
```

Разделять Graph/MCP transport model, internal mail model и AI analysis model.

## 6. Security / Permissions

Целевой read-only набор:
```text
Mail.Read
MailboxSettings.Read
User.Read
```

Сервер:
```text
--preset mail --read-only
--http 127.0.0.1:3000
--public-url https://mcp-ms365.kvantexpert.ru
```

Public MCP endpoint:
`https://mcp-ms365.kvantexpert.ru/mcp`

## 7. Deployment checkpoint

Зафиксировано:
- Ubuntu 22.04.5 LTS;
- Node.js v24.21.0 на сервере;
- systemd `mcp-ms365.service`;
- `/opt/mcp-ms365`;
- bind `127.0.0.1:3000`;
- Nginx reverse proxy;
- HTTPS/Let's Encrypt;
- DNS `mcp-ms365.kvantexpert.ru`.

Проверки:
```text
curl http://127.0.0.1:3000
→ Microsoft 365 MCP Server is running

GET /mcp
→ 405

POST /mcp без Bearer
→ 401 Unauthorized
```

Это подтверждает работу HTTP endpoint и OAuth protection.

## 8. OAuth discovery checkpoint

Protected Resource Metadata рекламирует ресурс `https://mcp-ms365.kvantexpert.ru/mcp`, authorization server `https://mcp-ms365.kvantexpert.ru` и scopes `Mail.Read`, `MailboxSettings.Read`, `User.Read`.

Authorization server metadata подтверждает:
- `/authorize`
- `/token`
- `/register`
- authorization code + refresh token;
- PKCE `S256`.

## 9. MCP Inspector

Windows client:
`Node v24.19.0`.

PowerShell блокировал `npx.ps1`; рабочий обход — `npx.cmd`.

Inspector запущен. Demo `example-server-default` не относится к проекту.

Использовать:
```text
Transport: Streamable HTTP
URL: https://mcp-ms365.kvantexpert.ru/mcp
```

## 10. Текущий OAuth blocker

Фактический URL Inspector показал:
```text
client_id=084a3e9f-a9f4-43f7-89f9-d229cf97853e
scope=Mail.Read MailboxSettings.Read User.Read offline_access
redirect_uri=http://127.0.0.1:6274/oauth/callback
response_type=code
code_challenge_method=S256
```

Microsoft возвращает:
```text
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid.
The expected value is a URI which matches a redirect URI registered for this client application.
```

Причина: callback Inspector `http://127.0.0.1:6274/oauth/callback` не совпадает с зарегистрированным Redirect URI Microsoft App Registration.

Это не проблема Nginx, HTTPS, MCP transport или Graph Mail API. OAuth уже дошёл до Microsoft.

### Следующее действие
Открыть Microsoft Entra / App Registration для client ID:
`084a3e9f-a9f4-43f7-89f9-d229cf97853e`

Проверить Authentication / Redirect URIs и зарегистрировать фактически используемый callback:
`http://127.0.0.1:6274/oauth/callback`

После этого повторить Connect в Inspector, пройти login/consent, получить token, установить MCP session и выполнить первый mail read.

## 11. Первый E2E

Первый smoke test:
`Покажи последние письма`

Затем:
- `Найди письмо от клиента`;
- сводка входящих;
- письма, требующие ответа;
- история переписки;
- классификация;
- proposal организации.

## 12. Definition of Done Phase 1

- [ ] OAuth Inspector работает
- [ ] MCP session устанавливается
- [ ] read-only scopes подтверждены
- [ ] mail tools доступны
- [ ] последние письма читаются
- [ ] нормализация работает
- [ ] summary работает
- [ ] important analysis работает
- [ ] needs-reply analysis работает
- [ ] thread/history работает
- [ ] classification работает
- [ ] sender analysis работает
- [ ] organization proposal работает
- [ ] тесты и документация обновлены

После этого — отдельное решение о `mcp-ms365-mail-write-v1`.

## 13. Правило восстановления

Этот документ — архитектурный источник истины.
Операционный источник истины — `docs/ROADMAP_MAIL_ASSISTANT.md`.

Команда восстановления:
> Открой docs/ROADMAP_MAIL_ASSISTANT.md и docs/MAIL_ASSISTANT_DESIGN.md. Продолжи работу с текущего checkpoint, не пересматривая уже закрытые этапы.