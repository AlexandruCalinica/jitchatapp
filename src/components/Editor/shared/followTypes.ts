import { User } from "./types";

import type {
  PresenceUser,
  PingReceivedPayload,
  FollowScrollPayload,
  FollowDocSwitchPayload,
  FollowerInfo,
  LeaderState,
  SendPingResponse,
} from "../../../hooks/useFollowChannel";

export type {
  PresenceUser,
  PingReceivedPayload,
  FollowScrollPayload,
  FollowDocSwitchPayload,
  FollowerInfo,
  LeaderState,
  SendPingResponse,
};

export interface ChannelFollowState {
  followingUserId: string | null;
  followingUser: User | null;
  isFollowing: boolean;
}

export interface ChannelPingNotification {
  ping: PingReceivedPayload;
  receivedAt: number;
}
