import { createContext, useContext, ReactNode } from 'react';
import { useChannels } from '../hooks/useChannels';
import { Channel, Document } from '../services/channels';

interface ChannelsContextValue {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  selectedDocumentId: string | null;
  selectDocument: (documentId: string) => void;
  addChannel: (name: string, description?: string) => Promise<Channel>;
  addDocument: (channelId: string, title?: string) => Promise<Document>;
  refresh: () => Promise<void>;
}

const ChannelsContext = createContext<ChannelsContextValue | null>(null);

export function ChannelsProvider({ children }: { children: ReactNode }) {
  const channelsState = useChannels();

  return (
    <ChannelsContext.Provider value={channelsState}>
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
