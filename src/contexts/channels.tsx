import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useChannelsElectric, ChannelWithDocuments } from '../hooks/useChannelsElectric';
import { Document } from '../collections/documents';

interface ChannelsContextValue {
  channels: ChannelWithDocuments[];
  loading: boolean;
  error: string | null;
  selectedDocumentId: string | null;
  selectDocument: (documentId: string) => void;
  addChannel: (name: string, description?: string) => Promise<ChannelWithDocuments>;
  updateChannel: (channelId: string, name: string) => Promise<ChannelWithDocuments>;
  removeChannel: (channelId: string) => Promise<void>;
  addDocument: (channelId: string, name?: string) => Promise<Document>;
  updateDocument: (documentId: string, name: string) => Promise<Document>;
  removeDocument: (documentId: string) => Promise<void>;
  findChannelByDocumentId: (documentId: string) => ChannelWithDocuments | undefined;
  refresh: () => Promise<void>;
}

const ChannelsContext = createContext<ChannelsContextValue | null>(null);

export function ChannelsProvider({ children }: { children: ReactNode }) {
  const {
    channels,
    loading,
    error,
    selectedDocumentId,
    selectDocument,
    addChannel: addChannelSync,
    updateChannel: updateChannelSync,
    removeChannel: removeChannelSync,
    addDocument: addDocumentSync,
    updateDocument: updateDocumentSync,
    removeDocument: removeDocumentSync,
    findChannelByDocumentId,
    refresh: refreshSync,
  } = useChannelsElectric();

  const addChannel = useCallback(
    async (name: string, description?: string): Promise<ChannelWithDocuments> => {
      addChannelSync(name, description);
      return {
        id: crypto.randomUUID(),
        name,
        description,
        tenant_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        documents: [],
      };
    },
    [addChannelSync]
  );

  const updateChannel = useCallback(
    async (channelId: string, name: string): Promise<ChannelWithDocuments> => {
      updateChannelSync(channelId, name);
      const channel = channels.find((c) => c.id === channelId);
      return channel ?? {
        id: channelId,
        name,
        description: undefined,
        tenant_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        documents: [],
      };
    },
    [updateChannelSync, channels]
  );

  const removeChannel = useCallback(
    async (channelId: string): Promise<void> => {
      removeChannelSync(channelId);
    },
    [removeChannelSync]
  );

  const addDocument = useCallback(
    async (channelId: string, name?: string): Promise<Document> => {
      addDocumentSync(channelId, name);
      return {
        id: crypto.randomUUID(),
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
      };
    },
    [addDocumentSync]
  );

  const updateDocument = useCallback(
    async (documentId: string, name: string): Promise<Document> => {
      updateDocumentSync(documentId, name);
      const channel = findChannelByDocumentId(documentId);
      const doc = channel?.documents.find((d) => d.id === documentId);
      return doc ?? {
        id: documentId,
        name,
        body: '',
        color: '#6b7280',
        icon: 'file-02',
        lexical_state: null,
        ref_id: channel?.id ?? '',
        tenant_id: '',
        user_id: '',
        inserted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    [updateDocumentSync, findChannelByDocumentId]
  );

  const removeDocument = useCallback(
    async (documentId: string): Promise<void> => {
      removeDocumentSync(documentId);
    },
    [removeDocumentSync]
  );

  const refresh = useCallback(async (): Promise<void> => {
    refreshSync();
  }, [refreshSync]);

  return (
    <ChannelsContext.Provider
      value={{
        channels,
        loading,
        error,
        selectedDocumentId,
        selectDocument,
        addChannel,
        updateChannel,
        removeChannel,
        addDocument,
        updateDocument,
        removeDocument,
        findChannelByDocumentId,
        refresh,
      }}
    >
      {children}
    </ChannelsContext.Provider>
  );
}

export function useChannelsContext(): ChannelsContextValue {
  const context = useContext(ChannelsContext);
  if (!context) {
    throw new Error('useChannelsContext must be used within a ChannelsProvider');
  }
  return context;
}
