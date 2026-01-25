import { $create, $setState, ParagraphNode, $getState } from "lexical";

import { User } from "../shared/types";
import { userState, draftState, timestampState } from "../plugins/nodeStates";
import { getAvatarUrl } from "../../../utils/avatar";

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return timeStr;
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

export class ExtendedParagraphNode extends ParagraphNode {
  $config() {
    return this.config("extended-paragraph", {
      extends: ParagraphNode,
    });
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);

    if (user) {
      dom.setAttribute("data-user", user.username);
      const avatarUrl = getAvatarUrl(user, "small");
      dom.style.setProperty("--avatar-url", `url(${avatarUrl})`);
    }
    if (isDraft) {
      dom.setAttribute("data-draft", "true");
    }
    if (timestamp !== undefined) {
      dom.setAttribute("data-timestamp", timestamp.toString());
      dom.setAttribute("data-time", formatTime(timestamp));
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: any): boolean {
    const update = super.updateDOM(prevNode, dom, config);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);

    if (user) {
      dom.setAttribute("data-user", user.username);
      const avatarUrl = getAvatarUrl(user, "small");
      dom.style.setProperty("--avatar-url", `url(${avatarUrl})`);
    } else {
      dom.removeAttribute("data-user");
      dom.style.removeProperty("--avatar-url");
    }

    if (isDraft) {
      dom.setAttribute("data-draft", "true");
    } else {
      dom.removeAttribute("data-draft");
    }

    if (timestamp !== undefined) {
      dom.setAttribute("data-timestamp", timestamp.toString());
      dom.setAttribute("data-time", formatTime(timestamp));
    } else {
      dom.removeAttribute("data-timestamp");
      dom.removeAttribute("data-time");
    }

    return update;
  }
}

export function $createExtendedParagraphNode(
  user?: User,
  isDraft?: boolean,
  timestamp?: number
): ExtendedParagraphNode {
  let node = $setState($create(ExtendedParagraphNode), userState, user);

  if (isDraft !== undefined) {
    node = $setState(node, draftState, isDraft);
  }

  if (timestamp !== undefined) {
    node = $setState(node, timestampState, timestamp);
  }

  return node;
}

export function $isExtendedParagraphNode(
  node: any
): node is ExtendedParagraphNode {
  return node instanceof ExtendedParagraphNode;
}
