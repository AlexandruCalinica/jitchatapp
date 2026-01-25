import { getToken, getBackendUrl } from './auth';

export interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  documents: Document[];
  created_at: string;
  updated_at: string;
}

interface ChannelsResponse {
  data: Channel[];
}

interface ChannelResponse {
  data: Channel;
}

export async function getChannels(): Promise<Channel[]> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getBackendUrl()}/api/channels`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch channels');
  }

  const { data } = await response.json() as ChannelsResponse;
  return data;
}

export async function getChannel(channelId: string): Promise<Channel> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getBackendUrl()}/api/channels/${channelId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch channel');
  }

  const { data } = await response.json() as ChannelResponse;
  return data;
}

export async function createChannel(name: string, description?: string): Promise<Channel> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getBackendUrl()}/api/channels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    throw new Error('Failed to create channel');
  }

  const { data } = await response.json() as ChannelResponse;
  return data;
}

export async function createDocument(channelId: string, title?: string): Promise<Document> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getBackendUrl()}/api/channels/${channelId}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error('Failed to create document');
  }

  const { data } = await response.json() as { data: Document };
  return data;
}

export function formatDocumentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  }
  
  if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
