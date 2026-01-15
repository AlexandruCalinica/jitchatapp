import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

import {
  useFollowChannel,
  PresenceUser,
  PingReceivedPayload,
  FollowScrollPayload,
  FollowDocSwitchPayload,
} from "../../../hooks/useFollowChannel";
import { User } from "../shared/types";
import { ChannelFollowState, ChannelPingNotification } from "../shared/followTypes";

interface ScrollEvent {
  payload: FollowScrollPayload;
  eventId: number;
}

interface DocSwitchEvent {
  payload: FollowDocSwitchPayload;
  eventId: number;
}

interface FollowChannelContextValue {
  isConnected: boolean;
  onlineUsers: PresenceUser[];
  followers: Set<string>;
  hasFollowers: boolean;
  followState: ChannelFollowState;
  pendingPings: ChannelPingNotification[];
  currentDocId: string | null;
  lastScrollEvent: ScrollEvent | null;
  lastDocSwitchEvent: DocSwitchEvent | null;

  sendPing: (targets: string[] | "all") => void;
  startFollowing: (userId: string) => Promise<void>;
  stopFollowing: () => void;
  dismissPing: (timestamp: number) => void;
  broadcastScroll: (scrollTop: number) => void;
  setCurrentDocId: (docId: string | null) => void;
}

const FollowChannelContext = createContext<FollowChannelContextValue | null>(null);

interface FollowChannelProviderProps {
  children: React.ReactNode;
  documentId: string | null;
  onScrollReceived?: (payload: FollowScrollPayload) => void;
  onDocSwitchReceived?: (payload: FollowDocSwitchPayload) => void;
  onLeaderOffline?: (leaderId: string) => void;
}

export function FollowChannelProvider({
  children,
  documentId,
  onScrollReceived,
  onDocSwitchReceived,
  onLeaderOffline,
}: FollowChannelProviderProps) {
  const followChannel = useFollowChannel();
  const [currentDocId, setCurrentDocIdState] = useState<string | null>(documentId);
  const [pendingPings, setPendingPings] = useState<ChannelPingNotification[]>([]);
  const [followState, setFollowState] = useState<ChannelFollowState>({
    followingUserId: null,
    followingUser: null,
    isFollowing: false,
  });
  const [lastScrollEvent, setLastScrollEvent] = useState<ScrollEvent | null>(null);
  const [lastDocSwitchEvent, setLastDocSwitchEvent] = useState<DocSwitchEvent | null>(null);
  const eventIdRef = useRef(0);

  const scrollCallbackRef = useRef(onScrollReceived);
  const docSwitchCallbackRef = useRef(onDocSwitchReceived);
  const leaderOfflineCallbackRef = useRef(onLeaderOffline);

  useEffect(() => {
    scrollCallbackRef.current = onScrollReceived;
    docSwitchCallbackRef.current = onDocSwitchReceived;
    leaderOfflineCallbackRef.current = onLeaderOffline;
  }, [onScrollReceived, onDocSwitchReceived, onLeaderOffline]);

  useEffect(() => {
    if (documentId !== currentDocId) {
      setCurrentDocIdState(documentId);
      followChannel.updatePresence(documentId);
    }
  }, [documentId, currentDocId, followChannel]);

  useEffect(() => {
    const unsubPing = followChannel.onPingReceived((payload: PingReceivedPayload) => {
      const notification: ChannelPingNotification = {
        ping: payload,
        receivedAt: Date.now(),
      };
      setPendingPings((prev) => {
        const isDuplicate = prev.some(
          (p) =>
            p.ping.from.user_id === payload.from.user_id &&
            Math.abs(p.ping.timestamp - payload.timestamp) < 5000
        );
        if (isDuplicate) return prev;
        return [...prev, notification];
      });
    });

    const unsubScroll = followChannel.onFollowScroll((payload: FollowScrollPayload) => {
      eventIdRef.current += 1;
      setLastScrollEvent({ payload, eventId: eventIdRef.current });
      scrollCallbackRef.current?.(payload);
    });

    const unsubDocSwitch = followChannel.onFollowDocSwitch((payload: FollowDocSwitchPayload) => {
      eventIdRef.current += 1;
      setLastDocSwitchEvent({ payload, eventId: eventIdRef.current });
      docSwitchCallbackRef.current?.(payload);
    });

    const unsubLeaderOffline = followChannel.onLeaderOffline((leaderId: string) => {
      setFollowState({
        followingUserId: null,
        followingUser: null,
        isFollowing: false,
      });
      leaderOfflineCallbackRef.current?.(leaderId);
    });

    return () => {
      unsubPing();
      unsubScroll();
      unsubDocSwitch();
      unsubLeaderOffline();
    };
  }, [followChannel]);

  useEffect(() => {
    if (!followState.isFollowing || !followState.followingUserId) return;

    const leader = followChannel.onlineUsers.find(
      (u) => u.user_id === followState.followingUserId
    );

    if (!leader) {
      setFollowState({
        followingUserId: null,
        followingUser: null,
        isFollowing: false,
      });
    }
  }, [followChannel.onlineUsers, followState.followingUserId, followState.isFollowing]);

  const sendPing = useCallback(
    (targets: string[] | "all") => {
      followChannel.sendPing(targets, currentDocId ?? undefined).catch(console.error);
    },
    [followChannel, currentDocId]
  );

  const startFollowing = useCallback(
    async (userId: string): Promise<void> => {
      const leaderState = await followChannel.startFollowing(userId);

      const leader = followChannel.onlineUsers.find((u) => u.user_id === userId);
      const followingUser: User | null = leader
        ? {
            id: leader.user_id,
            username: leader.username,
            color: leader.color,
          }
        : null;

      setFollowState({
        followingUserId: userId,
        followingUser,
        isFollowing: true,
      });

      if (leaderState.doc_id && leaderState.doc_id !== currentDocId) {
        const docSwitchPayload = {
          leader_id: userId,
          doc_id: leaderState.doc_id,
        };
        eventIdRef.current += 1;
        setLastDocSwitchEvent({ payload: docSwitchPayload, eventId: eventIdRef.current });
        docSwitchCallbackRef.current?.(docSwitchPayload);
      }

      if (leaderState.scroll_top !== null) {
        const scrollPayload = {
          leader_id: userId,
          doc_id: leaderState.doc_id ?? currentDocId ?? "",
          scroll_top: leaderState.scroll_top,
        };
        eventIdRef.current += 1;
        setLastScrollEvent({ payload: scrollPayload, eventId: eventIdRef.current });
        scrollCallbackRef.current?.(scrollPayload);
      }
    },
    [followChannel, currentDocId]
  );

  const stopFollowing = useCallback(() => {
    followChannel.stopFollowing();
    setFollowState({
      followingUserId: null,
      followingUser: null,
      isFollowing: false,
    });
  }, [followChannel]);

  const dismissPing = useCallback((timestamp: number) => {
    setPendingPings((prev) => prev.filter((p) => p.ping.timestamp !== timestamp));
  }, []);

  const broadcastScroll = useCallback(
    (scrollTop: number) => {
      if (!currentDocId) return;
      followChannel.broadcastScroll(currentDocId, scrollTop);
    },
    [followChannel, currentDocId]
  );

  const setCurrentDocId = useCallback(
    (docId: string | null) => {
      setCurrentDocIdState(docId);
      followChannel.broadcastDocSwitch(docId ?? "");
    },
    [followChannel]
  );

  const value: FollowChannelContextValue = {
    isConnected: followChannel.isConnected,
    onlineUsers: followChannel.onlineUsers,
    followers: followChannel.followers,
    hasFollowers: followChannel.followers.size > 0,
    followState,
    pendingPings,
    currentDocId,
    lastScrollEvent,
    lastDocSwitchEvent,

    sendPing,
    startFollowing,
    stopFollowing,
    dismissPing,
    broadcastScroll,
    setCurrentDocId,
  };

  return (
    <FollowChannelContext.Provider value={value}>
      {children}
    </FollowChannelContext.Provider>
  );
}

export function useFollowChannel2(): FollowChannelContextValue {
  const context = useContext(FollowChannelContext);
  if (!context) {
    throw new Error("useFollowChannel2 must be used within FollowChannelProvider");
  }
  return context;
}

export function useFollowChannelOptional(): FollowChannelContextValue | null {
  return useContext(FollowChannelContext);
}
