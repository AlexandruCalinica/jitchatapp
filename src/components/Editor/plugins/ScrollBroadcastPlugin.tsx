import { useEffect, useRef } from "react";

import { useFollowChannelOptional } from "../contexts/FollowChannelContext";

interface ScrollBroadcastPluginProps {
  containerRef?: React.RefObject<HTMLDivElement>;
  throttleMs?: number;
}

export function ScrollBroadcastPlugin({
  containerRef,
  throttleMs = 100,
}: ScrollBroadcastPluginProps) {
  const followContext = useFollowChannelOptional();
  const lastBroadcastTime = useRef(0);
  const pendingBroadcast = useRef<number | null>(null);

  useEffect(() => {
    if (!followContext?.hasFollowers) {
      return;
    }

    const scrollContainer = containerRef?.current?.closest('[data-scroll-container]') as HTMLElement | null
      ?? containerRef?.current?.parentElement as HTMLElement | null;

    if (!scrollContainer) {
      return;
    }

    const handleScroll = () => {
      const now = Date.now();
      const timeSinceLastBroadcast = now - lastBroadcastTime.current;

      if (timeSinceLastBroadcast >= throttleMs) {
        lastBroadcastTime.current = now;
        followContext.broadcastScroll(scrollContainer.scrollTop);
      } else {
        if (pendingBroadcast.current !== null) {
          clearTimeout(pendingBroadcast.current);
        }
        pendingBroadcast.current = window.setTimeout(() => {
          lastBroadcastTime.current = Date.now();
          followContext.broadcastScroll(scrollContainer.scrollTop);
          pendingBroadcast.current = null;
        }, throttleMs - timeSinceLastBroadcast);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (pendingBroadcast.current !== null) {
        clearTimeout(pendingBroadcast.current);
      }
    };
  }, [followContext, containerRef, throttleMs]);

  return null;
}
