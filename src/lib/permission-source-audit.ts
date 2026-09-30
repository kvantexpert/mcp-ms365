import type { CommandOptions } from '../cli.js';

export interface PermissionSourceAuditInput {
  clientId: string;
  tenant: string;
  cloudType: string;
  cacheLocation: string;
  requestedScopes: string[];
  presetScopes: string[];
  args: CommandOptions;
  env: Record<string, string | undefined>;
  argv: string[];
}

/** Build a safe config report; environment values and credentials are never copied verbatim. */
export function buildPermissionSourceAudit(input: PermissionSourceAuditInput) {
  const commandLineHas = (option: string) =>
    input.argv.some((argument) => argument === option || argument.startsWith(`${option}=`));
  const configured = (name: string) => Boolean(input.env[name]?.trim());
  const source = (option: string, envName: string) =>
    commandLineHas(option) ? 'command-line' : configured(envName) ? 'environment' : 'none';

  const keyVaultConfigured = configured('MS365_MCP_KEYVAULT_URL');
  const enabledToolsSource = configured('ENABLED_TOOLS')
    ? 'ENABLED_TOOLS environment override'
    : input.args.preset
      ? 'selected preset'
      : commandLineHas('--enabled-tools')
        ? 'command-line tool filter'
        : 'default tool catalog';

  return {
    clientId: input.clientId,
    tenant: input.tenant,
    cloudType: input.cloudType,
    preset: input.args.preset ?? null,
    presetScopes: [...input.presetScopes].sort((a, b) => a.localeCompare(b)),
    requestedScopes: [...input.requestedScopes],
    environmentOverrides: {
      enabledTools: {
        configured: configured('ENABLED_TOOLS'),
        source: enabledToolsSource,
      },
      extraScopes: {
        configured: commandLineHas('--extra-scopes') || configured('MS365_MCP_EXTRA_SCOPES'),
        source: source('--extra-scopes', 'MS365_MCP_EXTRA_SCOPES'),
      },
      allowedScopes: {
        configured: commandLineHas('--allowed-scopes') || configured('MS365_MCP_ALLOWED_SCOPES'),
        source: source('--allowed-scopes', 'MS365_MCP_ALLOWED_SCOPES'),
      },
      clientId: {
        configured: configured('MS365_MCP_CLIENT_ID'),
        source: keyVaultConfigured
          ? 'Azure Key Vault'
          : configured('MS365_MCP_CLIENT_ID')
            ? 'MS365_MCP_CLIENT_ID environment override'
            : 'built-in cloud default',
      },
      tenant: {
        configured: configured('MS365_MCP_TENANT_ID'),
        source: keyVaultConfigured
          ? 'Azure Key Vault'
          : configured('MS365_MCP_TENANT_ID')
            ? 'MS365_MCP_TENANT_ID environment override'
            : 'default tenant',
      },
      cloudType: {
        configured: configured('MS365_MCP_CLOUD_TYPE'),
        source: keyVaultConfigured
          ? 'Azure Key Vault or cloud default'
          : configured('MS365_MCP_CLOUD_TYPE')
            ? 'MS365_MCP_CLOUD_TYPE environment override'
            : 'global cloud default',
      },
      keyVault: { configured: keyVaultConfigured },
      clientSecret: { configured: configured('MS365_MCP_CLIENT_SECRET') },
      cachePath: {
        configured: configured('MS365_MCP_TOKEN_CACHE_PATH'),
        source: configured('MS365_MCP_TOKEN_CACHE_PATH')
          ? 'MS365_MCP_TOKEN_CACHE_PATH environment override'
          : 'default per-user config path',
      },
      customCacheCommand: { configured: configured('MS365_MCP_AUTH_CACHE_COMMAND') },
    },
    cacheLocation: input.cacheLocation,
    scopeConstructionSource: [
      'src/endpoints.json declares per-tool permission groups',
      'src/tool-categories.ts maps the selected preset to tool names',
      'src/auth.ts buildAllowedScopeDiagnostics filters permissions to enabled tools and allowed scopes',
      'src/auth.ts resolveAuthScopes appends explicit extra scopes to the MSAL request',
    ],
    graphApiCalls: 0,
  };
}
