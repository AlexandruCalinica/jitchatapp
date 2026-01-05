import { getToken, getBackendUrl } from './auth';

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  content_type: string;
  size: number;
  width?: number;
  height?: number;
  uploaded_by: string;
  uploaded_at: string;
}

export async function uploadImage(file: File, channelId: string): Promise<UploadedImage> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  if (!channelId) {
    throw new Error('Channel ID is required');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('channel_id', channelId);

  const response = await fetch(`${getBackendUrl()}/api/uploads/images`, {
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
  return data as UploadedImage;
}
