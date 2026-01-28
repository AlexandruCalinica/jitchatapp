import { useLiveQuery } from '@tanstack/react-db';
import { useState, useCallback, useMemo } from 'react';
import {
  channelsCollection,
  addChannel as addChannelToCollection,
  updateChannelName,
  removeChannel as removeChannelFromCollection,
  Channel,
} from '../collections/channels';
import {
  documentsCollection,
  addDocument as addDocumentToCollection,
  updateDocumentName,
  removeDocument as removeDocumentFromCollection,
  Document,
} from '../collections/documents';

export interface ChannelWithDocuments extends Channel {
  documents: Document[];
}

interface UseChannelsElectricReturn {
  channels: ChannelWithDocuments[];
  loading: boolean;
  error: string | null;
  selectedDocumentId: string | null;
  selectDocument: (documentId: string) => void;
  addChannel: (name: string, description?: string) => void;
  updateChannel: (channelId: string, name: string) => void;
  removeChannel: (channelId: string) => void;
  addDocument: (channelId: string, title?: string) => string;
  updateDocument: (documentId: string, title: string) => void;
  removeDocument: (documentId: string) => void;
  findChannelByDocumentId: (documentId: string) => ChannelWithDocuments | undefined;
  refresh: () => void;
}

export function useChannelsElectric(): UseChannelsElectricReturn {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const {
    data: channels = [],
    isLoading: channelsLoading,
    isError: channelsError,
  } = useLiveQuery((q) =>
    q.from({ channel: channelsCollection }).orderBy(({ channel }) => channel.created_at, 'asc')
  );

  const { data: documents = [], isLoading: docsLoading } = useLiveQuery((q) =>
    q.from({ doc: documentsCollection }).orderBy(({ doc }) => doc.created_at, 'asc')
  );

  const channelsWithDocs = useMemo((): ChannelWithDocuments[] => {
    return (channels as unknown as Channel[]).map((channel) => ({
      ...channel,
      documents: (documents as unknown as Document[]).filter(
        (doc) => doc.ref_id === channel.id
      ),
    }));
  }, [channels, documents]);

  const findChannelByDocumentId = useCallback(
    (documentId: string) => {
      return channelsWithDocs.find((channel) =>
        channel.documents.some((doc) => doc.id === documentId)
      );
    },
    [channelsWithDocs]
  );

  const selectDocument = useCallback((documentId: string) => {
    setSelectedDocumentId(documentId);
  }, []);

  const handleAddChannel = useCallback((name: string, description?: string) => {
    addChannelToCollection(name, description);
  }, []);

  const handleUpdateChannel = useCallback((channelId: string, name: string) => {
    updateChannelName(channelId, name);
  }, []);

  const handleRemoveChannel = useCallback(
    (channelId: string) => {
      const channel = channelsWithDocs.find((c) => c.id === channelId);

      if (
        channel &&
        selectedDocumentId &&
        channel.documents.some((d) => d.id === selectedDocumentId)
      ) {
        const otherChannel = channelsWithDocs.find(
          (c) => c.id !== channelId && c.documents.length > 0
        );
        setSelectedDocumentId(otherChannel?.documents[0]?.id ?? null);
      }

      removeChannelFromCollection(channelId);
    },
    [channelsWithDocs, selectedDocumentId]
  );

  const handleAddDocument = useCallback((channelId: string, title?: string): string => {
    return addDocumentToCollection(channelId, title);
  }, []);

  const handleUpdateDocument = useCallback((documentId: string, name: string) => {
    updateDocumentName(documentId, name);
  }, []);

  const handleRemoveDocument = useCallback(
    (documentId: string) => {
      const channel = findChannelByDocumentId(documentId);

      removeDocumentFromCollection(documentId);

      if (selectedDocumentId === documentId && channel) {
        const remainingDocs = channel.documents.filter((d) => d.id !== documentId);
        if (remainingDocs.length > 0) {
          setSelectedDocumentId(remainingDocs[0].id);
        } else {
          const otherChannel = channelsWithDocs.find(
            (c) => c.id !== channel.id && c.documents.length > 0
          );
          setSelectedDocumentId(otherChannel?.documents[0]?.id ?? null);
        }
      }
    },
    [findChannelByDocumentId, selectedDocumentId, channelsWithDocs]
  );

  const refresh = useCallback(() => {}, []);

  return {
    channels: channelsWithDocs,
    loading: channelsLoading || docsLoading,
    error: channelsError ? 'Failed to load channels' : null,
    selectedDocumentId,
    selectDocument,
    addChannel: handleAddChannel,
    updateChannel: handleUpdateChannel,
    removeChannel: handleRemoveChannel,
    addDocument: handleAddDocument,
    updateDocument: handleUpdateDocument,
    removeDocument: handleRemoveDocument,
    findChannelByDocumentId,
    refresh,
  };
}
