import type { LexicalNode, NodeKey, NodeMap } from "lexical";
import {
  getAnchorAndFocusCollabNodesForUserState,
  type Binding,
  type Provider,
} from "@lexical/yjs";

import { createDOMRange, createRectsFromDOMRange } from "@lexical/selection";
import { $isLineBreakNode } from "lexical";

import {
  $isExtendedTextNode,
  ExtendedTextNode,
} from "../../nodes/ExtendedTextNode";
import {
  $isExtendedParagraphNode,
  ExtendedParagraphNode,
} from "../../nodes/ExtendedParagraphNode";
import { userState } from "../nodeStates";
import { User } from "../../shared/types";

export type CursorSelection = {
  anchor: {
    key: NodeKey;
    offset: number;
  };
  caret: HTMLElement;
  color: string;
  focus: {
    key: NodeKey;
    offset: number;
  };
  name: HTMLSpanElement;
  selections: Array<HTMLElement>;
};

export type Cursor = {
  color: string;
  name: string;
  selection: null | CursorSelection;
};

function createCursor(name: string, color: string): Cursor {
  return {
    color: color,
    name: name,
    selection: null,
  };
}

function destroySelection(binding: Binding, selection: CursorSelection) {
  const cursorsContainer = binding.cursorsContainer;

  if (cursorsContainer !== null) {
    const selections = selection.selections;
    const selectionsLength = selections.length;

    for (let i = 0; i < selectionsLength; i++) {
      cursorsContainer.removeChild(selections[i]);
    }
  }
}

function destroyCursor(binding: Binding, cursor: Cursor) {
  const selection = cursor.selection;

  if (selection !== null) {
    destroySelection(binding, selection);
  }
}

function updateCursor(
  binding: Binding,
  cursor: Cursor,
  nextSelection: null | CursorSelection,
  nodeMap: NodeMap
): void {
  const editor = binding.editor;
  const rootElement = editor.getRootElement();
  const cursorsContainer = binding.cursorsContainer;

  if (cursorsContainer === null || rootElement === null) {
    return;
  }

  const cursorsContainerOffsetParent = cursorsContainer.offsetParent;
  if (cursorsContainerOffsetParent === null) {
    return;
  }

  const containerRect = cursorsContainerOffsetParent.getBoundingClientRect();
  const prevSelection = cursor.selection;

  if (nextSelection === null) {
    if (prevSelection === null) {
      return;
    } else {
      cursor.selection = null;
      destroySelection(binding, prevSelection);
      return;
    }
  } else {
    cursor.selection = nextSelection;
  }

  const caret = nextSelection.caret;
  const color = nextSelection.color;
  const selections = nextSelection.selections;
  const anchor = nextSelection.anchor;
  const focus = nextSelection.focus;
  const anchorKey = anchor.key;
  const focusKey = focus.key;
  const anchorNode = nodeMap.get(anchorKey);
  const focusNode = nodeMap.get(focusKey);

  if (anchorNode == null || focusNode == null) {
    return;
  }

  let selectionRects: Array<DOMRect>;

  // In the case of a collapsed selection on a linebreak, we need
  // to improvise as the browser will return nothing here as <br>
  // apparently take up no visual space :/
  // This won't work in all cases, but it's better than just showing
  // nothing all the time.
  if (anchorNode === focusNode && $isLineBreakNode(anchorNode)) {
    const brRect = (
      editor.getElementByKey(anchorKey) as HTMLElement
    ).getBoundingClientRect();
    selectionRects = [brRect];
  } else {
    const range = createDOMRange(
      editor,
      anchorNode,
      anchor.offset,
      focusNode,
      focus.offset
    );

    if (range === null) {
      return;
    }
    selectionRects = createRectsFromDOMRange(editor, range);
  }

  const selectionsLength = selections.length;
  const selectionRectsLength = selectionRects.length;

  for (let i = 0; i < selectionRectsLength; i++) {
    const selectionRect = selectionRects[i];
    let selection = selections[i];

    if (selection === undefined) {
      selection = document.createElement("span");
      selections[i] = selection;
      const selectionBg = document.createElement("span");
      selection.appendChild(selectionBg);
      cursorsContainer.appendChild(selection);
    }

    const top = selectionRect.top - containerRect.top;
    const left = selectionRect.left - containerRect.left;
    const style = `position:absolute;top:${top}px;left:${left}px;height:${selectionRect.height}px;width:${selectionRect.width}px;pointer-events:none;z-index:5;`;
    selection.style.cssText = style;

    (
      selection.firstChild as HTMLSpanElement
    ).style.cssText = `${style}left:0;top:0;background-color:${color};opacity:0.3;`;

    if (i === selectionRectsLength - 1) {
      if (caret.parentNode !== selection) {
        selection.appendChild(caret);
      }
    }
  }

  for (let i = selectionsLength - 1; i >= selectionRectsLength; i--) {
    const selection = selections[i];
    cursorsContainer.removeChild(selection);
    selections.pop();
  }
}

function createCursorSelection(
  cursor: Cursor,
  anchorKey: NodeKey,
  anchorOffset: number,
  focusKey: NodeKey,
  focusOffset: number,
  hasFollowers: boolean = false
): CursorSelection {
  const color = cursor.color;
  const caret = document.createElement("span");
  caret.style.cssText = `background-color:${color};`;
  caret.className =
    "absolute top-0 bottom-0 right-[-1px] w-[2px] z-[10] rounded-bl-[1px] rounded-br-[1px] animate-slideUpFade";
  const name = document.createElement("span");
  name.textContent = cursor.name;
  name.style.cssText = `background-color:${color};`;
  name.className =
    "absolute left-[-0px] top-[-16px] text-white text-xs rounded-sm rounded-bl-none leading-none p-0.5 font-bold whitespace-nowrap animate-slideUpFade";

  if (hasFollowers) {
    const followerBadge = document.createElement("span");
    followerBadge.textContent = " 👁";
    followerBadge.className = "ml-0.5 opacity-90";
    name.appendChild(followerBadge);
  }

  caret.appendChild(name);
  return {
    anchor: {
      key: anchorKey,
      offset: anchorOffset,
    },
    caret,
    color,
    focus: {
      key: focusKey,
      offset: focusOffset,
    },
    name,
    selections: [],
  };
}

export const syncCursorPositions = (binding: Binding, provider: Provider) => {
  const awarnessStates = Array.from(provider.awareness.getStates());
  const localClientId = binding.clientID;
  const cursors = binding.cursors;
  const editor = binding.editor;
  const nodeMap = editor._editorState._nodeMap;

  const followersMap = new Map<number, boolean>();
  for (const [, state] of awarnessStates) {
    const followingClientId = (state as { following?: number }).following;
    if (followingClientId !== undefined && followingClientId !== null) {
      followersMap.set(followingClientId, true);
    }
  }

  const visitedClientIds = new Set();

  for (let i = 0; i < awarnessStates.length; i++) {
    const [clientId, awarness] = awarnessStates[i];

    if (clientId === localClientId) {
      continue;
    }

    visitedClientIds.add(clientId);
    let selection = null;
    const { name, color, focusing } = awarness;
    const cursor = cursors.get(clientId) ?? createCursor(name, color);
    const hasFollowers = followersMap.has(clientId);

    cursors.set(clientId, cursor);

    if (focusing) {
      const { anchorCollabNode, anchorOffset, focusCollabNode, focusOffset } =
        getAnchorAndFocusCollabNodesForUserState(binding, awarness);

      if (anchorCollabNode !== null && focusCollabNode !== null) {
        const anchorKey = anchorCollabNode.getKey();
        const focusKey = focusCollabNode.getKey();
        const anchorNode = nodeMap.get(anchorKey);
        const focusNode = nodeMap.get(focusKey);

        if (anchorNode === null || focusNode === null) {
          return;
        }

        if (isNodeWithUserState(anchorNode)) {
          const anchorNodeUser = readUserState(anchorNode);
          if (anchorNodeUser?.username !== cursor.name) {
            return;
          }
        }

        if (isNodeWithUserState(focusNode)) {
          const focusNodeUser = readUserState(focusNode);
          if (focusNodeUser?.username !== cursor.name) {
            return;
          }
        }

        selection = cursor.selection;

        const prevHasFollowers = selection?.name?.textContent?.includes("👁") ?? false;
        const needsRebuild = hasFollowers !== prevHasFollowers;

        if (selection === null || needsRebuild) {
          if (selection !== null) {
            destroySelection(binding, selection);
          }
          selection = createCursorSelection(
            cursor,
            anchorKey,
            anchorOffset,
            focusKey,
            focusOffset,
            hasFollowers
          );
        } else {
          const anchor = selection.anchor;
          const focus = selection.focus;
          anchor.key = anchorKey;
          anchor.offset = anchorOffset;
          focus.key = focusKey;
          focus.offset = focusOffset;
        }
      }

      updateCursor(binding, cursor, selection, nodeMap);
    }
  }

  const allClientIDs = Array.from(cursors.keys());

  for (let i = 0; i < allClientIDs.length; i++) {
    const clientID = allClientIDs[i];

    if (!visitedClientIds.has(clientID)) {
      const cursor = cursors.get(clientID);

      if (cursor !== undefined) {
        destroyCursor(binding, cursor);
        cursors.delete(clientID);
      }
    }
  }
};

function readUserState(node?: LexicalNode): User | undefined {
  if (node && node.__state) {
    return node.__state.getValue(userState);
  }
}

function isNodeWithUserState(
  node?: LexicalNode
): node is ExtendedTextNode | ExtendedParagraphNode {
  return $isExtendedTextNode(node) || $isExtendedParagraphNode(node);
}
