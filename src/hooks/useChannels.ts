import { useState, useEffect, useCallback } from 'react';
import { getChannels, createChannel, createDocument, Channel, Document } from '../services/channels';

interface UseChannelsReturn {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  selectedDocumentId: string | null;
  selectDocument: (documentId: string) => void;
  addChannel: (name: string, description?: string) => Promise<Channel>;
  addDocument: (channelId: string, title?: string) => Promise<Document>;
  refresh: () => Promise<void>;
}

export function useChannels(): UseChannelsReturn {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getChannels();
      setChannels(data);
      
      if (!selectedDocumentId && data.length > 0) {
        const firstChannel = data[0];
        if (firstChannel.documents.length > 0) {
          setSelectedDocumentId(firstChannel.documents[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  }, [selectedDocumentId]);

  useEffect(() => {
    fetchChannels();
  }, []);

  const selectDocument = useCallback((documentId: string) => {
    setSelectedDocumentId(documentId);
  }, []);

  const addChannel = useCallback(async (name: string, description?: string) => {
    const newChannel = await createChannel(name, description);
    setChannels(prev => [...prev, newChannel]);
    return newChannel;
  }, []);

  const addDocument = useCallback(async (channelId: string, title?: string) => {
    const newDocument = await createDocument(channelId, title);
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        return { ...channel, documents: [...channel.documents, newDocument] };
      }
      return channel;
    }));
    return newDocument;
  }, []);

  return {
    channels,
    loading,
    error,
    selectedDocumentId,
    selectDocument,
    addChannel,
    addDocument,
    refresh: fetchChannels,
  };
}
