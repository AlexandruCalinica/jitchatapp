import { Avatar } from '@ark-ui/react/avatar';
import { User } from '../../services/auth';
import { getAvatarUrl } from '../../utils/avatar';

interface AccountAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md';
}

export function AccountAvatar({ user, size = 'md' }: AccountAvatarProps) {
  const sizeClasses = size === 'xs' ? 'w-4 h-4 text-xs' : size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const initials = user.username.slice(0, 2).toUpperCase();
  const avatarUrl = getAvatarUrl(user, size === 'xs' ? 'small' : size === 'sm' ? 'small' : 'medium');

  return (
    <Avatar.Root
      className={`relative inline-flex items-center justify-center rounded-full ring-2 ${sizeClasses}`}
      style={{ '--tw-ring-color': user.color } as React.CSSProperties}
    >
      <Avatar.Fallback className="flex items-center justify-center w-full h-full rounded-full bg-zed-active font-medium text-zed-fg">
        {initials}
      </Avatar.Fallback>
      <Avatar.Image
        src={avatarUrl}
        className="w-full h-full rounded-full object-cover"
        alt={user.username}
      />
    </Avatar.Root>
  );
}
