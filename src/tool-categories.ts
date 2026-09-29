import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

export interface ToolCategory {
  name: string;
  pattern: RegExp;
  description: string;
  requiresOrgMode?: boolean;
  readOnly?: boolean;
  disableAuthTools?: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const endpointEntries = JSON.parse(
  readFileSync(path.join(__dirname, 'endpoints.json'), 'utf8')
) as Array<{ toolName: string; presets?: string[] }>;

// Preset metadata. Membership lives in endpoints.json: each endpoint declares
// which presets it belongs to via its `presets` array, so presets are exact
// tool-name allow-lists that can't over-match across apps the way the old
// loose name regexes could (e.g. "mail" also matching shared-mailbox tools).
const PRESET_META: Record<
  string,
  {
    description: string;
    requiresOrgMode?: boolean;
    omitUniversalUtilities?: boolean;
    toolPreset?: string;
    readOnly?: boolean;
    disableAuthTools?: boolean;
  }
> = {
  mail: {
    description: 'Email operations (read, send, manage folders, attachments)',
  },
  'mail-readonly': {
    description: 'Read-only email operations with authentication and account tools disabled',
    toolPreset: 'mail',
    readOnly: true,
    disableAuthTools: true,
  },
  calendar: {
    description: 'Calendar and event management',
  },
  files: {
    description: 'OneDrive file and folder operations',
  },
  personal: {
    description:
      'Personal productivity tools (mail, calendar, files, contacts, tasks, notes, search)',
  },
  work: {
    description: 'Organization/work tools (Teams, SharePoint, shared mailboxes, search)',
    requiresOrgMode: true,
  },
  excel: {
    description: 'Excel spreadsheet operations',
  },
  contacts: {
    description: 'Outlook contacts management',
  },
  tasks: {
    description: 'Task and planning tools (To Do, Planner)',
  },
  onenote: {
    description: 'OneNote notebook operations',
  },
  search: {
    description: 'Microsoft Search capabilities',
  },
  users: {
    description: 'User directory access',
    requiresOrgMode: true,
  },
  outlook: {
    description: 'Outlook app only: mail, calendar and contacts',
  },
  onedrive: {
    description: 'OneDrive app only: drive and file operations, excluding Excel',
  },
  teams: {
    description: 'Teams app only: chats, channels, meetings and presence',
    requiresOrgMode: true,
  },
  'teams-write': {
    description:
      'Teams send-only: send/reply in chats and channels, list chats/teams/channels by name, activity notifications - no message reading',
    requiresOrgMode: true,
    // A write-only preset must not include the generic byte readers.
    omitUniversalUtilities: true,
  },
};

// Utility tools (graph-tools.ts UTILITY_TOOLS) are code-defined, not in endpoints.json, so they
// carry no `presets` there and every --preset filter dropped them - e.g. `--preset files` had
// get-drive-item but no downloader, though its llmTip tells the model to call one. Declare their
// preset membership here and fold it into each preset pattern.
//
// download-bytes and download-bytes-to-file both read ANY relative Graph binary path (drive files,
// attachments, photos, Teams content, recordings, OneNote resources) - one returns base64, the other
// streams the bytes to a local file - so they belong in EVERY preset. Universal rather than an
// enumerated list because a list would silently miss apps and every future preset.
const UNIVERSAL_UTILITY_TOOLS = ['download-bytes', 'download-bytes-to-file'];

// Scoped utilities are only meaningful where the resources they act on appear. get-download-url
// resolves a pre-authenticated URL for drive/SharePoint file content ONLY (not mail/event
// attachments or recordings), so it rides with the drive-backed presets; where it is absent the
// universal download-bytes still reads the bytes. parse-teams-url only parses Teams meeting URLs.
// Mail classification and organization preview utilities operate only on message fields supplied
// by mail read tools; they do not make Graph requests or change mailbox state.
const SCOPED_UTILITY_TOOLS: Record<string, string[]> = {
  'classify-mail-message': ['mail'],
  'preview-mail-organization': ['mail'],
  'get-download-url': ['files', 'onedrive', 'personal', 'work', 'search'],
  'parse-teams-url': ['teams', 'teams-write', 'work'],
};

// Fail fast if a scoped utility references a preset that does not exist (e.g. a typo like
// 'serach'): otherwise the tool would silently never join the intended preset, with no error.
for (const [tool, presets] of Object.entries(SCOPED_UTILITY_TOOLS)) {
  for (const preset of presets) {
    if (!Object.prototype.hasOwnProperty.call(PRESET_META, preset)) {
      throw new Error(
        `SCOPED_UTILITY_TOOLS["${tool}"] references unknown preset "${preset}" (not in PRESET_META)`
      );
    }
  }
}

function presetPattern(preset: string): RegExp {
  const toolPreset = PRESET_META[preset]?.toolPreset ?? preset;
  const endpointNames = [
    ...new Set(
      endpointEntries.filter((e) => e.presets?.includes(toolPreset)).map((e) => e.toolName)
    ),
  ];
  // Guard on endpoint membership, not the final `names` list: the universal utility spread below
  // would otherwise mask a preset that no endpoint declares (a typo'd or unwired preset name).
  if (endpointNames.length === 0) {
    throw new Error(`Preset "${preset}" matches no endpoints in endpoints.json`);
  }
  const names = [
    ...endpointNames,
    ...(PRESET_META[toolPreset]?.omitUniversalUtilities ? [] : UNIVERSAL_UTILITY_TOOLS),
    ...Object.entries(SCOPED_UTILITY_TOOLS)
      .filter(([, presets]) => presets.includes(toolPreset))
      .map(([name]) => name),
  ];
  return new RegExp(`^(?:${names.join('|')})$`);
}

export const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  ...Object.fromEntries(
    Object.entries(PRESET_META).map(([name, meta]) => [
      name,
      { name, pattern: presetPattern(name), ...meta },
    ])
  ),
  all: {
    name: 'all',
    pattern: /.*/,
    description: 'All available tools',
  },
};

export function getCombinedPresetPattern(presets: string[]): string {
  const patterns = presets.map((preset) => {
    const category = TOOL_CATEGORIES[preset];
    if (!category) {
      throw new Error(
        `Unknown preset: ${preset}. Available presets: ${Object.keys(TOOL_CATEGORIES).join(', ')}`
      );
    }
    return category.pattern.source;
  });
  return patterns.join('|');
}

export function getPresetOptions(presets: string[]): {
  readOnly?: boolean;
  disableAuthTools?: boolean;
} {
  const options: { readOnly?: boolean; disableAuthTools?: boolean } = {};
  for (const preset of presets) {
    const category = TOOL_CATEGORIES[preset];
    if (!category) {
      throw new Error(
        `Unknown preset: ${preset}. Available presets: ${Object.keys(TOOL_CATEGORIES).join(', ')}`
      );
    }
    if (category.readOnly) options.readOnly = true;
    if (category.disableAuthTools) options.disableAuthTools = true;
  }
  return options;
}

export function listPresets(): Array<{
  name: string;
  description: string;
  requiresOrgMode?: boolean;
  readOnly?: boolean;
  disableAuthTools?: boolean;
}> {
  return Object.values(TOOL_CATEGORIES).map((category) => ({
    name: category.name,
    description: category.description,
    requiresOrgMode: category.requiresOrgMode,
    readOnly: category.readOnly,
    disableAuthTools: category.disableAuthTools,
  }));
}

export function presetRequiresOrgMode(preset: string): boolean {
  const category = TOOL_CATEGORIES[preset];
  return category?.requiresOrgMode || false;
}
