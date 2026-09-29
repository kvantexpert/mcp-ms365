# Mail Classification

## Purpose

Phase 1.1 adds a local, deterministic classification layer for individual mail
messages. The reusable function lives at `src/lib/mail-classification.ts`.
The MCP utility `classify-mail-message` accepts fields already returned by
`list-mail-messages` or `get-mail-message` and returns an analytical
recommendation. It does not retrieve messages itself.

The utility is scoped to the `mail` preset, so it is available in
`mail-readonly`. Its MCP annotations mark it read-only and closed-world. Existing
Graph tools and their registration behavior are unchanged.

## Input

The classifier accepts:

- `subject`: message subject;
- `sender`: sender display name;
- `senderEmail`: sender email address;
- `bodyPreview`: message preview text, not the full body;
- `receivedDateTime`: Graph received timestamp.

The first version uses subject, preview, sender name, and sender domain as
classification signals. It accepts `receivedDateTime` for a stable message
input shape, but does not use time in scoring. It makes no Graph request.

## Categories

Built-in categories:

- Clients
- Projects
- Finance
- Documents
- Security
- Automation
- Personal

The pure function supports additional deterministic rules and custom category
names through its `additionalRules` option. Custom rules can define keywords,
sender-name or sender-domain signals, and a suggested folder.

## Algorithm

The classifier normalizes text and applies local keyword and sender-pattern
rules:

- subject keyword match: 3 points;
- body preview keyword match: 1 point;
- sender name or domain pattern match: 2 points.

The highest scoring category is selected. Ties follow the built-in rule order,
then the order of additional rules. A matching Finance invoice or supplier
signal suggests `Finance/Invoices`; other categories suggest a folder matching
the category. When no rule matches, the result defaults to Personal with low
confidence. The confidence value is a bounded heuristic score, not a calibrated
probability. Reasons identify the matched signals.

Topic signals in this first version include invoice and payment terms, project
and meeting terms, contract and document terms, and security terms. The sender
signals include sender display-name and email-domain patterns. Communication
frequency and contact importance cannot be inferred from one message and are
not computed by this version.

## Output

The MCP utility returns JSON with:

- `category`;
- `confidence` from 0 to 1;
- `reasons`;
- `suggestedFolder`.

The suggested folder is only a recommendation. Classification does not add
Outlook categories or persist results.

## Limitations

- Rules are deterministic and intentionally small; they do not use an external
  AI service.
- Keyword matches can be ambiguous. The current result gives the highest
  scoring category and does not claim semantic understanding.
- Sender frequency and importance require a separate multi-message analysis.
- The classifier receives supplied fields only; callers should obtain them
  with the existing read tools and pass only the data needed for analysis.

## Read-only guarantee

The utility performs local computation only. It has no Graph client call and
does not create folders, move or modify messages, create rules, send mail, or
change mailbox state. The existing `mail-readonly` permissions and OAuth setup
are unchanged. No Graph scopes were added.
