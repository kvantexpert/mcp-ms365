# MCP-MS365 Current Architecture State

## Purpose

This document fixes the current understanding of why the server exists and how it is used.

## Current operating model

```
AI Client (ChatGPT / MCP Host)
        |
        | MCP Protocol
        v
mcp-ms365
        |
        | Microsoft Graph API
        v
Microsoft 365 account
(Delegated OAuth access)
```

## Important decision

The current setup does NOT use Azure-hosted infrastructure.

The chosen model:

- direct Microsoft account authorization;
- OAuth delegated permissions;
- local MCP server;
- Microsoft Graph access through user authorization.

## Server role

mcp-ms365 is an adapter layer:

- exposes Microsoft 365 capabilities as MCP tools;
- handles authentication flow;
- sends requests to Microsoft Graph;
- returns structured responses to AI clients.

## Current checkpoint

Date: 2026-09-29

Status:

- repository access verified;
- architecture reviewed;
- authentication model documented;
- next work: security audit and operational documentation.
