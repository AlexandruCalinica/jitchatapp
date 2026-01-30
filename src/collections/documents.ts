import { nanoid } from 'nanoid'
import { createCollection } from '@tanstack/react-db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { getToken, getBackendUrl } from '../services/auth';

export interface Document {
  id: string;
  name: string;
  body: string;
  color: string;
  icon: string;
  lexical_state: string | null;
  ref_id: string;
  tenant_id: string;
  user_id: string;
  inserted_at: string;
  updated_at: string;
}

async function getAuthToken(): Promise<string> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return `Bearer ${token}`;
}

type MutationOperation =
  | { type: 'insert'; modified: Record<string, unknown>; syncMetadata: { relation: string[] } }
  | {
      type: 'update';
      original: Record<string, unknown>;
      changes: Record<string, unknown>;
      syncMetadata: { relation: string[] };
    }
  | { type: 'delete'; original: Record<string, unknown>; syncMetadata: { relation: string[] } };

async function mutate(operations: MutationOperation[]): Promise<{ txid: number }> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getBackendUrl()}/api/mutate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ transaction: operations }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Mutation failed' }));
    throw new Error(error.message || 'Mutation failed');
  }

  return response.json();
}

export const documentsCollection = createCollection(
  electricCollectionOptions({
    id: 'documents',

    shapeOptions: {
      url: `${getBackendUrl()}/sync/documents`,
      headers: {
        Authorization: getAuthToken,
      },
    },

    getKey: (doc) => doc.id as string,

    onInsert: async ({ transaction }) => {
      const operations: MutationOperation[] = transaction.mutations.map((m) => ({
        type: 'insert' as const,
        modified: m.modified as Record<string, unknown>,
        syncMetadata: { relation: ['public', 'documents'] },
      }));

      const { txid } = await mutate(operations);
      return { txid };
    },

    onUpdate: async ({ transaction }) => {
      const operations: MutationOperation[] = transaction.mutations.map((m) => {
        return {
          type: 'update' as const,
          original: { id: m.key },
          changes: m.modified as Record<string, unknown>,
          syncMetadata: { relation: ['public', 'documents'] },
        }
      });

      const { txid } = await mutate(operations);
      return { txid };
    },

    onDelete: async ({ transaction }) => {
      const operations: MutationOperation[] = transaction.mutations.map((m) => ({
        type: 'delete' as const,
        original: { id: m.key },
        syncMetadata: { relation: ['public', 'documents'] },
      }));

      const { txid } = await mutate(operations);
      return { txid };
    },
  })
);

export function addDocument(channelId: string, name?: string): string {
  const id = `doc_${nanoid()}`;
  documentsCollection.insert({
    id,
    name: name || 'Untitled',
    body: '',
    color: '#6b7280',
    icon: 'file-02',
    lexical_state: null,
    ref_id: channelId,
    tenant_id: '',
    user_id: '',
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return id;
}

export function updateDocumentName(documentId: string, name: string): void {
  documentsCollection.update(documentId, (draft) => {
    draft.name = name;
    draft.updated_at = new Date().toISOString();
  });
}

export function removeDocument(documentId: string): void {
  documentsCollection.delete(documentId);
}
