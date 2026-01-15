import { useEffect, useState } from "react";
import clsx from "clsx";

import { Avatar } from "../../Avatar/Avatar";
import { PingReceivedPayload, ChannelPingNotification } from "../shared/followTypes";

interface FollowNotificationProps {
  ping: PingReceivedPayload;
  onAccept: () => void;
  onDismiss: () => void;
  autoHideMs?: number;
}

export function FollowNotification({
  ping,
  onAccept,
  onDismiss,
  autoHideMs = 15000,
}: FollowNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoHideMs);

    return () => clearTimeout(timer);
  }, [autoHideMs]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  const handleAccept = () => {
    setIsExiting(true);
    setTimeout(onAccept, 200);
  };

  const hasDocId = ping.doc_id !== null;

  return (
    <div
      className={clsx(
        "bg-zed-bg border border-zed-border rounded-lg shadow-lg p-3 min-w-[280px] max-w-[320px]",
        "transform transition-all duration-200",
        isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: ping.from.color + "20" }}
        >
          <Avatar size="xs" name={ping.from.username} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-zed-fg">
            <span className="font-medium">{ping.from.username}</span>
            <span className="text-zed-muted">
              {hasDocId
                ? " wants you to follow them"
                : " wants your attention"}
            </span>
          </div>
          {ping.message && (
            <div className="text-xs text-zed-muted mt-1 truncate">
              "{ping.message}"
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleDismiss}
              className={clsx(
                "px-3 py-1 text-sm rounded-md",
                "bg-zed-bg border border-zed-border text-zed-fg",
                "hover:bg-zed-active transition-colors"
              )}
            >
              Dismiss
            </button>
            <button
              onClick={handleAccept}
              className={clsx(
                "px-3 py-1 text-sm rounded-md",
                "text-white transition-colors"
              )}
              style={{ backgroundColor: ping.from.color }}
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FollowNotificationStackProps {
  notifications: ChannelPingNotification[];
  onAccept: (notification: ChannelPingNotification) => void;
  onDismiss: (timestamp: number) => void;
}

export function FollowNotificationStack({
  notifications,
  onAccept,
  onDismiss,
}: FollowNotificationStackProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <FollowNotification
          key={notification.ping.timestamp}
          ping={notification.ping}
          onAccept={() => onAccept(notification)}
          onDismiss={() => onDismiss(notification.ping.timestamp)}
        />
      ))}
    </div>
  );
}
