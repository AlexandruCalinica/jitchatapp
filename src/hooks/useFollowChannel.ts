import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { Channel, Presence } from "phoenix";

import { PhoenixSocketContext } from "../contexts/phoenix-socket";
import { useAuth } from "../contexts/auth";

export interface PresenceUser {
  user_id: string;
  username: string;
  color: string;
  current_doc_id: string | null;
  online_at: number;
}

export interface PingReceivedPayload {
  from: {
    user_id: string;
    username: string;
    color: string;
  };
  doc_id: string | null;
  message: string | null;
  timestamp: number;
}

export interface FollowScrollPayload {
  leader_id: string;
  doc_id: string;
  scroll_top: number;
  scroll_left?: number;
  viewport_height?: number;
}

export interface FollowDocSwitchPayload {
  leader_id: string;
  doc_id: string;
}

export interface FollowerInfo {
  user_id: string;
  username: string;
  color: string;
}

export interface LeaderState {
  doc_id: string | null;
  scroll_top: number | null;
}

export interface SendPingResponse {
  sent_to: string[];
  offline: string[];
}

interface EventHandlers {
  onPingReceived: ((payload: PingReceivedPayload) => void) | null;
  onFollowScroll: ((payload: FollowScrollPayload) => void) | null;
  onFollowDocSwitch: ((payload: FollowDocSwitchPayload) => void) | null;
  onLeaderOffline: ((leaderId: string) => void) | null;
  onFollowersChange: ((followers: Set<string>) => void) | null;
}

export function useFollowChannel() {
  const { socket } = useContext(PhoenixSocketContext);
  const { user } = useAuth();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [followers, setFollowers] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState<string | null>(null);

  const presenceRef = useRef<Presence | null>(null);
  const eventHandlersRef = useRef<EventHandlers>({
    onPingReceived: null,
    onFollowScroll: null,
    onFollowDocSwitch: null,
    onLeaderOffline: null,
    onFollowersChange: null,
  });

  useEffect(() => {
    if (!socket || !user?.id) {
      return;
    }

    const channelTopic = `follow:${user.id}`;
    const newChannel = socket.channel(channelTopic, {});

    const presence = new Presence(newChannel);
    presenceRef.current = presence;

    presence.onSync(() => {
      const users: PresenceUser[] = [];
      presence.list((id, { metas }) => {
        const meta = metas[0] as PresenceUser;
        if (meta && id !== user.id) {
          users.push({
            user_id: id,
            username: meta.username,
            color: meta.color,
            current_doc_id: meta.current_doc_id,
            online_at: meta.online_at,
          });
        }
        return null;
      });
      setOnlineUsers(users);
    });

    newChannel.on("ping:received", (payload: PingReceivedPayload) => {
      eventHandlersRef.current.onPingReceived?.(payload);
    });

    newChannel.on("follow:started", ({ follower }: { follower: FollowerInfo }) => {
      setFollowers((prev) => {
        const next = new Set(prev);
        next.add(follower.user_id);
        eventHandlersRef.current.onFollowersChange?.(next);
        return next;
      });
    });

    newChannel.on("follow:stopped", ({ follower_id }: { follower_id: string }) => {
      setFollowers((prev) => {
        const next = new Set(prev);
        next.delete(follower_id);
        eventHandlersRef.current.onFollowersChange?.(next);
        return next;
      });
    });

    newChannel.on("follow:scroll", (payload: FollowScrollPayload) => {
      eventHandlersRef.current.onFollowScroll?.(payload);
    });

    newChannel.on("follow:doc_switch", (payload: FollowDocSwitchPayload) => {
      eventHandlersRef.current.onFollowDocSwitch?.(payload);
    });

    newChannel.on("follow:leader_offline", ({ leader_id }: { leader_id: string }) => {
      setIsFollowing(null);
      eventHandlersRef.current.onLeaderOffline?.(leader_id);
    });

    newChannel
      .join()
      .receive("ok", () => {
        setIsConnected(true);
        setChannel(newChannel);
      })
      .receive("error", ({ reason }) => {
        console.error("Failed to join follow channel:", reason);
        setIsConnected(false);
      });

    return () => {
      newChannel.leave();
      setChannel(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setFollowers(new Set());
      setIsFollowing(null);
      presenceRef.current = null;
    };
  }, [socket, user?.id]);

  const sendPing = useCallback(
    (
      targetIds: string[] | "all",
      docId?: string,
      message?: string
    ): Promise<SendPingResponse> => {
      return new Promise((resolve, reject) => {
        if (!channel) {
          reject(new Error("Channel not connected"));
          return;
        }

        channel
          .push("ping:send", {
            target_user_ids: targetIds,
            doc_id: docId ?? null,
            message: message ?? null,
          })
          .receive("ok", (response: SendPingResponse) => {
            resolve(response);
          })
          .receive("error", ({ reason }: { reason: string }) => {
            reject(new Error(reason));
          });
      });
    },
    [channel]
  );

  const startFollowing = useCallback(
    (leaderId: string): Promise<LeaderState> => {
      return new Promise((resolve, reject) => {
        if (!channel) {
          reject(new Error("Channel not connected"));
          return;
        }

        if (leaderId === user?.id) {
          reject(new Error("cannot_follow_self"));
          return;
        }

        channel
          .push("follow:start", { leader_id: leaderId })
          .receive("ok", ({ leader }: { leader: LeaderState }) => {
            setIsFollowing(leaderId);
            resolve(leader);
          })
          .receive("error", ({ reason }: { reason: string }) => {
            reject(new Error(reason));
          });
      });
    },
    [channel, user?.id]
  );

  const stopFollowing = useCallback(() => {
    if (!channel || !isFollowing) {
      return;
    }

    channel.push("follow:stop", {}).receive("ok", () => {
      setIsFollowing(null);
    });
  }, [channel, isFollowing]);

  const updatePresence = useCallback(
    (docId: string | null) => {
      if (!channel) {
        return;
      }

      channel.push("presence:update", { doc_id: docId });
    },
    [channel]
  );

  const broadcastScroll = useCallback(
    (docId: string, scrollTop: number, scrollLeft?: number, viewportHeight?: number) => {
      if (!channel || followers.size === 0) {
        return;
      }

      channel.push("follow:scroll", {
        doc_id: docId,
        scroll_top: scrollTop,
        scroll_left: scrollLeft ?? 0,
        viewport_height: viewportHeight,
      });
    },
    [channel, followers.size]
  );

  const broadcastDocSwitch = useCallback(
    (docId: string) => {
      if (!channel) {
        return;
      }

      channel.push("presence:update", { doc_id: docId });

      if (followers.size > 0) {
        channel.push("follow:doc_switch", { doc_id: docId });
      }
    },
    [channel, followers.size]
  );

  const onPingReceived = useCallback(
    (handler: (payload: PingReceivedPayload) => void) => {
      eventHandlersRef.current.onPingReceived = handler;
      return () => {
        eventHandlersRef.current.onPingReceived = null;
      };
    },
    []
  );

  const onFollowScroll = useCallback(
    (handler: (payload: FollowScrollPayload) => void) => {
      eventHandlersRef.current.onFollowScroll = handler;
      return () => {
        eventHandlersRef.current.onFollowScroll = null;
      };
    },
    []
  );

  const onFollowDocSwitch = useCallback(
    (handler: (payload: FollowDocSwitchPayload) => void) => {
      eventHandlersRef.current.onFollowDocSwitch = handler;
      return () => {
        eventHandlersRef.current.onFollowDocSwitch = null;
      };
    },
    []
  );

  const onLeaderOffline = useCallback((handler: (leaderId: string) => void) => {
    eventHandlersRef.current.onLeaderOffline = handler;
    return () => {
      eventHandlersRef.current.onLeaderOffline = null;
    };
  }, []);

  const onFollowersChange = useCallback(
    (handler: (followers: Set<string>) => void) => {
      eventHandlersRef.current.onFollowersChange = handler;
      return () => {
        eventHandlersRef.current.onFollowersChange = null;
      };
    },
    []
  );

  return {
    channel,
    isConnected,
    onlineUsers,
    followers,
    isFollowing,

    sendPing,
    startFollowing,
    stopFollowing,
    updatePresence,
    broadcastScroll,
    broadcastDocSwitch,

    onPingReceived,
    onFollowScroll,
    onFollowDocSwitch,
    onLeaderOffline,
    onFollowersChange,
  };
}
