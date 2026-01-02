import { $create, $setState, $getState } from "lexical";
import { QuoteNode } from "@lexical/rich-text";

import { User } from "../shared/types";
import { userState, draftState, timestampState } from "../plugins/nodeStates";

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return timeStr;
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

export class ExtendedQuoteNode extends QuoteNode {
  $config() {
    return this.config("extended-quote", {
      extends: QuoteNode,
    });
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);

    if (user) {
      dom.setAttribute("data-user", user.username);
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

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    const update = super.updateDOM(prevNode, dom);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);

    if (user) {
      dom.setAttribute("data-user", user.username);
    } else {
      dom.removeAttribute("data-user");
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

export function $createExtendedQuoteNode(
  user?: User,
  isDraft?: boolean,
  timestamp?: number
): ExtendedQuoteNode {
  let node = $setState($create(ExtendedQuoteNode), userState, user);

  if (isDraft !== undefined) {
    node = $setState(node, draftState, isDraft);
  }

  if (timestamp !== undefined) {
    node = $setState(node, timestampState, timestamp);
  }

  return node;
}

export function $isExtendedQuoteNode(
  node: any
): node is ExtendedQuoteNode {
  return node instanceof ExtendedQuoteNode;
}
