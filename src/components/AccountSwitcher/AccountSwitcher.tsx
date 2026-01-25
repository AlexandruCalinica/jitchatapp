import { Menu } from '@ark-ui/react/menu';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../contexts/auth';
import { AccountAvatar } from './AccountAvatar';
import DownIcon from '~icons/icon-park-outline/down';
import CheckIcon from '~icons/icon-park-outline/check';
import PlusIcon from '~icons/icon-park-outline/plus';
import LogoutIcon from '~icons/icon-park-outline/logout';
import SettingsIcon from '~icons/solar/settings-outline';

export function AccountSwitcher() {
  const navigate = useNavigate();
  const { user, accounts, login, logout, logoutAll, switchAccount } = useAuth();

  if (!user) return null;

  return (
    <Menu.Root>
      <Menu.Trigger className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zed-active transition-colors">
        <AccountAvatar user={user} size="xs" />
        <span className="text-sm font-medium max-w-[120px] truncate">{user.username}</span>
        <Menu.Indicator>
          <DownIcon className="w-4 h-4 text-zed-muted" />
        </Menu.Indicator>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className="bg-zed-bg rounded-lg shadow-lg border border-zed-border py-1 min-w-[220px] z-50">
          <Menu.RadioItemGroup
            value={user.id}
            onValueChange={(e) => switchAccount(e.value)}
          >
            {accounts.map((account) => (
              <Menu.RadioItem
                key={account.id}
                value={account.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zed-active cursor-pointer outline-none data-[highlighted]:bg-zed-active"
              >
                <Menu.ItemIndicator className="w-4 flex-shrink-0">
                  <CheckIcon className="w-4 h-4 text-zed-blue" />
                </Menu.ItemIndicator>
                <AccountAvatar user={account.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <Menu.ItemText className="text-sm font-medium truncate block">
                    {account.user.username}
                  </Menu.ItemText>
                  <span className="text-xs text-zed-muted truncate block">
                    {account.user.email}
                  </span>
                </div>
              </Menu.RadioItem>
            ))}
          </Menu.RadioItemGroup>

          <Menu.Separator className="my-1 border-t border-zed-border" />

          <Menu.Item
            value="settings"
            onSelect={() => navigate({ to: '/settings' })}
            className="flex items-center gap-2 px-3 py-2 hover:bg-zed-active cursor-pointer outline-none data-[highlighted]:bg-zed-active"
          >
            <SettingsIcon className="w-4 h-4 text-zed-muted" />
            <span className="text-sm">Settings</span>
          </Menu.Item>

          <Menu.Item
            value="add"
            onSelect={login}
            className="flex items-center gap-2 px-3 py-2 hover:bg-zed-active cursor-pointer outline-none data-[highlighted]:bg-zed-active"
          >
            <PlusIcon className="w-4 h-4 text-zed-muted" />
            <span className="text-sm">Add another account</span>
          </Menu.Item>

          <Menu.Separator className="my-1 border-t border-zed-border" />

          <Menu.Item
            value="logout"
            onSelect={logout}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer outline-none data-[highlighted]:bg-gray-50 text-red-600"
          >
            <LogoutIcon className="w-4 h-4" />
            <span className="text-sm">Sign out</span>
          </Menu.Item>

          {accounts.length > 1 && (
            <Menu.Item
              value="logout-all"
              onSelect={logoutAll}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer outline-none data-[highlighted]:bg-gray-50 text-red-600"
            >
              <LogoutIcon className="w-4 h-4" />
              <span className="text-sm">Sign out of all accounts</span>
            </Menu.Item>
          )}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
