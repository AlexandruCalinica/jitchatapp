import { useCallback } from "react";
import { createPortal } from "react-dom";

import { FollowNotificationStack } from "../components/FollowNotification";
import { useFollowChannelOptional } from "../contexts/FollowChannelContext";
import { ChannelPingNotification } from "../shared/followTypes";

export function FollowNotificationPlugin() {
  const followContext = useFollowChannelOptional();

  const handleAccept = useCallback(
    (notification: ChannelPingNotification) => {
      if (!followContext) return;

      followContext.startFollowing(notification.ping.from.user_id);
      followContext.dismissPing(notification.ping.timestamp);
    },
    [followContext]
  );

  const handleDismiss = useCallback(
    (timestamp: number) => {
      followContext?.dismissPing(timestamp);
    },
    [followContext]
  );

  if (!followContext) {
    return null;
  }

  return createPortal(
    <FollowNotificationStack
      notifications={followContext.pendingPings}
      onAccept={handleAccept}
      onDismiss={handleDismiss}
    />,
    document.body
  );
}
