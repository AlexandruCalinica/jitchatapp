import { useCallback } from "react";
import { createPortal } from "react-dom";

import { FollowNotificationStack } from "../components/FollowNotification";
import { useFollowChannelOptional } from "../contexts/FollowChannelContext";
import { ChannelPingNotification } from "../shared/followTypes";

export function FollowNotificationPlugin() {
  const followContext = useFollowChannelOptional();

  const handleAccept = useCallback(
    async (notification: ChannelPingNotification) => {
      if (!followContext) return;

      const pingDocId = notification.ping.doc_id;
      
      try {
        await followContext.startFollowing(notification.ping.from.user_id);
      } catch (error) {
        console.error("Failed to start following:", error);
      }
      
      if (pingDocId && pingDocId !== followContext.currentDocId) {
        followContext.navigateToDocument(pingDocId);
      }
      
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
