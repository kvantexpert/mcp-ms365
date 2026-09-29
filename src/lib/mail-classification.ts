export const MAIL_CLASSIFICATION_CATEGORIES = [
  'Clients',
  'Projects',
  'Finance',
  'Documents',
  'Security',
  'Automation',
  'Personal',
] as const;

export type MailClassificationCategory = string;

export interface MailClassificationInput {
  subject: string;
  sender: string;
  senderEmail: string;
  bodyPreview: string;
  receivedDateTime: string;
}

export interface MailClassificationRule {
  category: string;
  keywords?: readonly string[];
  senderNameKeywords?: readonly string[];
  senderDomainKeywords?: readonly string[];
  suggestedFolder?: string;
}

export interface MailClassificationOptions {
  /** Additional deterministic rules; custom categories are supported. */
  additionalRules?: readonly MailClassificationRule[];
}

export interface MailClassificationResult {
  category: MailClassificationCategory;
  /** Heuristic score from 0 to 1, not a calibrated probability. */
  confidence: number;
  reasons: string[];
  suggestedFolder: string;
}

const DEFAULT_RULES: readonly MailClassificationRule[] = [
  {
    category: 'Clients',
    keywords: ['client', 'customer'],
    senderNameKeywords: ['client', 'customer'],
    senderDomainKeywords: ['client'],
  },
  {
    category: 'Projects',
    keywords: ['project', 'meeting', 'milestone', 'sprint', 'deliverable'],
    senderNameKeywords: ['project'],
    senderDomainKeywords: ['project'],
  },
  {
    category: 'Finance',
    keywords: ['invoice', 'payment', 'bill', 'billing', 'supplier', 'vendor', 'expense', 'receipt'],
    senderNameKeywords: ['supplier', 'vendor'],
    senderDomainKeywords: ['supplier', 'vendor', 'billing', 'invoice'],
  },
  {
    category: 'Documents',
    keywords: ['document', 'contract', 'agreement', 'report'],
    senderNameKeywords: ['legal'],
    senderDomainKeywords: ['legal', 'documents'],
  },
  {
    category: 'Security',
    keywords: ['security', 'alert', 'password', 'suspicious', 'breach', 'vulnerability'],
    senderNameKeywords: ['security'],
    senderDomainKeywords: ['security'],
  },
  {
    category: 'Automation',
    keywords: ['automation', 'workflow', 'notification'],
    senderNameKeywords: ['automation', 'notification', 'noreply'],
    senderDomainKeywords: ['automation', 'notification', 'noreply'],
  },
];

interface RuleMatch {
  rule: MailClassificationRule;
  score: number;
  reasons: string[];
  matchedKeywords: string[];
  matchedSenderKeywords: string[];
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function includesKeyword(text: string, keyword: string): boolean {
  const normalizedKeyword = normalizeText(keyword);
  return normalizedKeyword !== '' && ` ${text} `.includes(` ${normalizedKeyword} `);
}

function getSenderDomain(senderEmail: string): string {
  const match = senderEmail.match(/@([^<>\s]+)/);
  return match ? normalizeText(match[1]) : '';
}

function matchRule(
  rule: MailClassificationRule,
  subject: string,
  bodyPreview: string,
  sender: string,
  senderDomain: string
): RuleMatch {
  let score = 0;
  const reasons: string[] = [];
  const matchedKeywords: string[] = [];
  const matchedSenderKeywords: string[] = [];

  for (const keyword of rule.keywords ?? []) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;

    if (includesKeyword(subject, keyword)) {
      score += 3;
      reasons.push(`${keyword} keyword detected in subject`);
      matchedKeywords.push(normalizedKeyword);
    }
    if (includesKeyword(bodyPreview, keyword)) {
      score += 1;
      reasons.push(`${keyword} keyword detected in message preview`);
      matchedKeywords.push(normalizedKeyword);
    }
  }

  for (const keyword of rule.senderNameKeywords ?? []) {
    if (includesKeyword(sender, keyword)) {
      score += 2;
      reasons.push(`sender name matches ${keyword} pattern`);
      matchedSenderKeywords.push(normalizeText(keyword));
    }
  }

  for (const keyword of rule.senderDomainKeywords ?? []) {
    if (includesKeyword(senderDomain, keyword)) {
      score += 2;
      reasons.push(`sender domain matches ${keyword} pattern`);
      matchedSenderKeywords.push(normalizeText(keyword));
    }
  }

  return { rule, score, reasons, matchedKeywords, matchedSenderKeywords };
}

function suggestedFolderFor(match: RuleMatch): string {
  if (match.rule.suggestedFolder) return match.rule.suggestedFolder;

  if (
    match.rule.category === 'Finance' &&
    (match.matchedKeywords.includes('invoice') ||
      match.matchedSenderKeywords.some((keyword) => ['supplier', 'vendor'].includes(keyword)))
  ) {
    return 'Finance/Invoices';
  }

  return match.rule.category;
}

/**
 * Classifies the supplied message fields locally. It performs no Graph requests and
 * does not modify messages, folders, categories, or any other mailbox data.
 */
export function classifyMailMessage(
  input: MailClassificationInput,
  options: MailClassificationOptions = {}
): MailClassificationResult {
  const subject = normalizeText(input.subject);
  const bodyPreview = normalizeText(input.bodyPreview);
  const sender = normalizeText(input.sender);
  const senderDomain = getSenderDomain(input.senderEmail);
  const rules = [...DEFAULT_RULES, ...(options.additionalRules ?? [])];

  const bestMatch = rules
    .filter((rule) => rule.category.trim() !== '')
    .map((rule) => matchRule(rule, subject, bodyPreview, sender, senderDomain))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score)[0];

  if (!bestMatch) {
    return {
      category: 'Personal',
      confidence: 0.35,
      reasons: ['No configured topic signal matched; defaulted to Personal.'],
      suggestedFolder: 'Personal',
    };
  }

  return {
    category: bestMatch.rule.category,
    confidence: Number(Math.min(0.95, 0.55 + bestMatch.score * 0.1).toFixed(2)),
    reasons: bestMatch.reasons,
    suggestedFolder: suggestedFolderFor(bestMatch),
  };
}
