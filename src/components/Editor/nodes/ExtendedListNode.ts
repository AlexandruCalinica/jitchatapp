import { $create, $setState, $getState } from "lexical";
import { ListNode, ListType, $isListItemNode } from "@lexical/list";

import { User } from "../shared/types";
import { userState, draftState, timestampState, listMarkerState } from "../plugins/nodeStates";
import { getAvatarUrl } from "../../../utils/avatar";

function updateChildrenListItemValue(list: ListNode): void {
  let value = list.getStart();
  for (const child of list.getChildren()) {
    if ($isListItemNode(child)) {
      if (child.getValue() !== value) {
        child.setValue(value);
      }
      value++;
    }
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return timeStr;
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

export class ExtendedListNode extends ListNode {
  $config() {
    return this.config("extended-list", {
      extends: ListNode,
      $transform: (node: ExtendedListNode): void => {
        updateChildrenListItemValue(node);
      },
    });
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);
    const marker = $getState(this, listMarkerState);

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
    if (marker) {
      dom.setAttribute("data-marker", marker);
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: any): boolean {
    const update = super.updateDOM(prevNode, dom, config);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);
    const marker = $getState(this, listMarkerState);

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

    if (marker) {
      dom.setAttribute("data-marker", marker);
    } else {
      dom.removeAttribute("data-marker");
    }

    return update;
  }
}

export function $createExtendedListNode(
  listType: ListType,
  user?: User,
  isDraft?: boolean,
  timestamp?: number,
  marker?: string
): ExtendedListNode {
  let node = $create(ExtendedListNode);
  node = node.setListType(listType);

  if (user) {
    node = $setState(node, userState, user);
  }

  if (isDraft !== undefined) {
    node = $setState(node, draftState, isDraft);
  }

  if (timestamp !== undefined) {
    node = $setState(node, timestampState, timestamp);
  }

  if (marker) {
    node = $setState(node, listMarkerState, marker);
  }

  return node;
}

export function $isExtendedListNode(
  node: any
): node is ExtendedListNode {
  return node instanceof ExtendedListNode;
}
