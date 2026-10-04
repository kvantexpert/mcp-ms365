# External Permission Source Audit

> **Historical diagnostic record.**
>
> This document records an earlier permission-source investigation performed before
> the QUANT EXPERT Mail Assistant read-only configuration was finalized.
>
> The Client ID, write-oriented preset and broad permission observations recorded in
> the original investigation are historical data and must not be used for the
> current deployment.

## Historical Context

The investigation analyzed a controlled `mail-write-controlled` configuration and
looked for the source of broader permission metadata observed in an MSAL cache.

The investigation concluded that the exact external source of those historical
metadata values could not be determined from the available local evidence.

## Findings

The audit ruled out the selected local preset, local endpoint-scope resolution and
scope-related environment overrides as the source of the broader cache metadata.

A remote application configuration or Microsoft consent/identity behavior remained
possible, but the available cache metadata could not distinguish those sources and
was not proof of granted permissions.

## Current Configuration

The active QUANT EXPERT Mail Assistant configuration is separate from this
historical investigation:

- Application: `QUANT EXPERT Mail Assistant`
- Client ID: `657cea31-052c-4e27-b97e-43a146ea72f0`
- Account: `quantexpert@outlook.com`
- Tenant: `consumers`
- Preset: `mail`
- Access mode: `read-only`
- Expected Graph scopes:
  - `Mail.Read`
  - `MailboxSettings.Read`
  - `User.Read`

The current deployment must not use the historical Client ID or historical
write-oriented permission configuration described by the original investigation.

## Safety

- Current deployment remains read-only.
- Write execution is not enabled.
- No mail write operations are part of the current checkpoint.
- This document does not authorize enabling write permissions or write functions.
