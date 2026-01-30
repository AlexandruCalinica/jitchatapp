import { nanoid } from 'nanoid'
import { createCollection } from '@tanstack/react-db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { getToken, getBackendUrl } from '../services/auth';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_at: string;
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

export const channelsCollection = createCollection(
  electricCollectionOptions({
    id: 'channels',

    shapeOptions: {
      url: `${getBackendUrl()}/sync/channels`,
      headers: {
        Authorization: getAuthToken,
      },
    },

    getKey: (channel) => channel.id as string,

    onInsert: async ({ transaction }) => {
      const operations: MutationOperation[] = transaction.mutations.map((m) => ({
        type: 'insert' as const,
        modified: m.modified as Record<string, unknown>,
        syncMetadata: { relation: ['public', 'channels'] },
      }));

      const { txid } = await mutate(operations);
      return { txid };
    },

    onUpdate: async ({ transaction }) => {
      const operations: MutationOperation[] = transaction.mutations.map((m) => {
        return {
          type: 'update' as const,
          original: { id: m.key },
          changes: m.changes as Record<string, unknown>,
          syncMetadata: { relation: ['public', 'channels'] },
        }
      });

      const { txid } = await mutate(operations);
      return { txid };
    },

    onDelete: async ({ transaction }) => {
      const operations: MutationOperation[] = transaction.mutations.map((m) => ({
        type: 'delete' as const,
        original: { id: m.key },
        syncMetadata: { relation: ['public', 'channels'] },
      }));

      const { txid } = await mutate(operations);
      return { txid };
    },
  })
);

export function addChannel(name: string, description?: string): void {
  channelsCollection.insert({
    id: `chan_${nanoid()}`,
    name,
    description,
    tenant_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export function updateChannelName(channelId: string, name: string): void {
  channelsCollection.update(channelId, (draft) => {
    draft.name = name;
    draft.updated_at = new Date().toISOString();
  });
}

export function removeChannel(channelId: string): void {
  channelsCollection.delete(channelId);
}
