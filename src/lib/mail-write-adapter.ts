export type MailWriteOperation = 'create-folder' | 'move-message';

export interface CreateFolderInput {
  parentFolderId: string | null;
  displayName: string;
}

export interface MoveMessageInput {
  messageId: string;
  destinationFolderId: string;
}

export interface MailWriteAdapterResult {
  status: 'success' | 'mock-success' | 'not-implemented';
  mode: 'mock' | 'graph';
  operation: MailWriteOperation;
  resourceId: string | null;
  graph: false;
}

/** Narrow interface for the only mail write operations in the approved plan. */
export interface MailWriteAdapter {
  createFolder(input: CreateFolderInput): Promise<MailWriteAdapterResult>;
  moveMessage(input: MoveMessageInput): Promise<MailWriteAdapterResult>;
}
