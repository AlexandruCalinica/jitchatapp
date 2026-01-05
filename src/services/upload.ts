import { getToken, getBackendUrl } from './auth';

export interface UploadedImage {
  url: string;
  filename: string;
}

export async function uploadImage(file: File, channelId?: string): Promise<UploadedImage> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (channelId) {
    formData.append('channel_id', channelId);
  }

  const response = await fetch(`${getBackendUrl()}/api/uploads/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  const { data } = await response.json();
  return {
    url: data.url,
    filename: data.filename,
  };
}
