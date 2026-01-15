import clsx from "clsx";

import { Avatar } from "../../Avatar/Avatar";
import { User } from "../shared/types";

interface FollowIndicatorProps {
  user: User;
  onStop: () => void;
}

export function FollowIndicator({ user, onStop }: FollowIndicatorProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-3 px-3 py-2",
        "bg-zed-bg/95 backdrop-blur-sm border-b border-zed-border",
        "animate-slideDown"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: user.color }}
        />
        <span className="text-sm text-zed-fg">
          Following{" "}
          <span className="font-medium" style={{ color: user.color }}>
            {user.username}
          </span>
        </span>
        <Avatar size="xxs" name={user.username} />
      </div>

      <button
        onClick={onStop}
        className={clsx(
          "px-2 py-0.5 text-xs rounded",
          "bg-zed-bg border border-zed-border text-zed-muted",
          "hover:bg-zed-active hover:text-zed-fg transition-colors"
        )}
      >
        Stop
      </button>
    </div>
  );
}
