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
  status: 'success';
  mode: 'mock';
  operation: MailWriteOperation;
  resourceId: string;
}

/** Narrow interface for the only mail write operations in the approved plan. */
export interface MailWriteAdapter {
  createFolder(input: CreateFolderInput): Promise<MailWriteAdapterResult>;
  moveMessage(input: MoveMessageInput): Promise<MailWriteAdapterResult>;
}
