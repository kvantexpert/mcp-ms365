import type { MailClassificationResult } from './mail-classification.js';

export interface MailActionMessageMetadata {
  messageId: string;
  subject: string;
  currentFolder?: string;
}

export interface MailFolderStructureRule {
  category: string;
  /** Supports `{suggestedFolder}` and `{projectName}` placeholders. */
  targetFolder: string;
}

export interface MoveMailActionProposal {
  action: 'move-message';
  messageId: string;
  currentFolder: string | null;
  targetFolder: string;
  reason: string[];
  status: 'preview';
}

export interface CreateMailFolderActionProposal {
  action: 'create-folder';
  parentFolderId: string | null;
  displayName: string;
  reason: string[];
  status: 'preview';
}

export type MailActionProposal = MoveMailActionProposal | CreateMailFolderActionProposal;

export const DEFAULT_MAIL_FOLDER_STRUCTURE_RULES: readonly MailFolderStructureRule[] = [
  { category: 'Finance', targetFolder: '{suggestedFolder}' },
  { category: 'Projects', targetFolder: 'Projects/{projectName}' },
];

function findProjectName(subject: string): string | undefined {
  // Use a capitalized project name and stop before a lower-case activity word such as "meeting".
  const match = subject.match(/\b[Pp]roject\s+([A-Z][\w-]*(?:\s+[A-Z][\w-]*)*)/);
  return match?.[1] ? `Project ${match[1].trim()}` : undefined;
}

/**
 * Creates a proposed action only. This pure function has no Graph client and
 * cannot move messages, create folders, or create rules.
 */
export function planMailAction(
  message: MailActionMessageMetadata,
  classification: MailClassificationResult,
  folderRules: readonly MailFolderStructureRule[] = []
): MailActionProposal {
  const rule = folderRules.find((candidate) => candidate.category === classification.category);
  const projectName =
    classification.category === 'Projects' ? findProjectName(message.subject) : undefined;
  const resolvedFolder = rule?.targetFolder
    .replace(/\{suggestedFolder\}/g, classification.suggestedFolder)
    .replace(/\{projectName\}/g, projectName ?? '')
    .replace(/\/$/, '');
  const targetFolder =
    resolvedFolder && !/\{[^}]+\}/.test(resolvedFolder)
      ? resolvedFolder
      : classification.suggestedFolder;
  const reason = [...classification.reasons];

  if (projectName && rule?.targetFolder.includes('{projectName}')) {
    reason.push(`Project name detected: ${projectName}`);
  }

  return {
    action: 'move-message',
    messageId: message.messageId,
    currentFolder: message.currentFolder ?? null,
    targetFolder,
    reason,
    status: 'preview',
  };
}
