import { Avatar } from '@ark-ui/react/avatar';
import { User } from '../../services/auth';

interface AccountAvatarProps {
  user: User;
  size?: 'sm' | 'md';
}

export function AccountAvatar({ user, size = 'md' }: AccountAvatarProps) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <Avatar.Root
      className={`relative inline-flex items-center justify-center rounded-full ring-2 ${sizeClasses}`}
      style={{ '--tw-ring-color': user.color } as React.CSSProperties}
    >
      <Avatar.Fallback className="flex items-center justify-center w-full h-full rounded-full bg-gray-200 font-medium text-gray-700">
        {initials}
      </Avatar.Fallback>
      <Avatar.Image
        className="w-full h-full rounded-full object-cover"
        alt={user.username}
      />
    </Avatar.Root>
  );
}
