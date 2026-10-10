# MCP-MS365 Troubleshooting Knowledge Base

## 1. Authentication problems

### Symptoms

- login does not open;
- Graph returns 401 Unauthorized;
- token expired.

### Checks

1. Verify Microsoft account login.
2. Clear token cache.
3. Authenticate again.
4. Check requested permissions.

## 2. Permission errors

### Symptoms

- 403 Forbidden;
- tool exists but operation fails.

### Checks

1. Identify Graph endpoint.
2. Identify required Microsoft Graph scope.
3. Re-authorize account.

## 3. MCP connection problems

### Symptoms

- client cannot see tools;
- server starts but tools are missing.

### Checks

1. Verify MCP transport configuration.
2. Check server startup logs.
3. Verify endpoint/tool registration.

## 4. Graph API errors

### Common causes

- invalid endpoint;
- missing parameters;
- expired token;
- insufficient permissions.

## Recovery procedure

1. Check logs.
2. Confirm authentication state.
3. Confirm Graph permissions.
4. Reproduce with minimal tool call.
5. Record fix in this document.

## Rule

Every resolved incident should add:

- symptom;
- root cause;
- fix;
- prevention step.

[executed on device: mcp-ms365 (65080dd4-e76f-4d8e-8c2a-b0745624fbad)]