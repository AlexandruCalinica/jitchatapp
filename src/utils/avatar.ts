import { getBackendUrl } from "../services/auth";

type AvatarSize = "small" | "medium" | "large";

interface AvatarUser {
  id: string;
  username?: string;
  color?: string;
  avatar_url?: string | null;
}

export function getAvatarUrl(
  user: AvatarUser,
  size: AvatarSize = "medium"
): string {
  const baseUrl = getBackendUrl();
  return `${baseUrl}/api/avatars/${user.id}?size=${size}`;
}
