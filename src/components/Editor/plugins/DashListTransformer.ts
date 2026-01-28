import { ElementTransformer } from "@lexical/markdown";
import { ListNode, ListItemNode, $isListItemNode, $isListNode } from "@lexical/list";
import { $getState, ElementNode } from "lexical";
import { $createExtendedListNode, $isExtendedListNode } from "../nodes/ExtendedListNode";
import { $createExtendedListItemNode } from "../nodes/ExtendedListItemNode";
import { configState } from "../shared/state";
import { listMarkerState } from "./nodeStates";

const LIST_INDENT_SIZE = 4;

function $listExport(
  listNode: ListNode,
  exportChildren: (node: ElementNode) => string,
  depth: number,
  marker: string
): string {
  const output: string[] = [];
  const children = listNode.getChildren();
  let index = 0;

  for (const listItemNode of children) {
    if ($isListItemNode(listItemNode)) {
      const isNestedList = listItemNode.getChildrenSize() === 1 && $isListNode(listItemNode.getFirstChild());
      if (isNestedList) {
        const nestedList = listItemNode.getFirstChild() as ListNode;
        const nestedMarker = $isExtendedListNode(nestedList) && $getState(nestedList, listMarkerState) === "dash" ? "-" : "*";
        output.push($listExport(nestedList, exportChildren, depth + 1, nestedMarker));
        continue;
      }

      const indent = " ".repeat(depth * LIST_INDENT_SIZE);
      const listType = listNode.getListType();
      
      let prefix: string;
      if (listType === "number") {
        prefix = `${listNode.getStart() + index}. `;
      } else if (listType === "check") {
        const checked = listItemNode.getChecked() ? "x" : " ";
        prefix = `${marker} [${checked}] `;
      } else {
        prefix = `${marker} `;
      }

      output.push(indent + prefix + exportChildren(listItemNode));
      index++;
    }
  }

  return output.join("\n");
}

export const DASH_LIST: ElementTransformer = {
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    if (!$isExtendedListNode(node)) {
      return null;
    }
    const marker = $getState(node, listMarkerState);
    if (marker !== "dash") {
      return null;
    }
    return $listExport(node, exportChildren, 0, "-");
  },
  regExp: /^(\s*)-\s/,
  replace: (parentNode, children, _match, isImport) => {
    const listNode = $createExtendedListNode(
      "bullet",
      configState.currentUser ?? undefined,
      configState.defaultDraft,
      undefined,
      "dash"
    );

    const listItem = $createExtendedListItemNode(
      configState.currentUser ?? undefined,
      configState.defaultDraft
    );
    listNode.append(listItem);

    if (children && children.length > 0) {
      listItem.append(...children);
    }

    parentNode.replace(listNode);

    if (!isImport) {
      listItem.select(0, 0);
    }
  },
  type: "element",
};

export const STAR_LIST: ElementTransformer = {
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    if (!$isListNode(node) || node.getListType() !== "bullet") {
      return null;
    }
    const marker = $isExtendedListNode(node) ? $getState(node, listMarkerState) : undefined;
    if (marker === "dash") {
      return null;
    }
    return $listExport(node, exportChildren, 0, "*");
  },
  regExp: /^(\s*)[*+]\s/,
  replace: (parentNode, children, _match, isImport) => {
    const listNode = $createExtendedListNode(
      "bullet",
      configState.currentUser ?? undefined,
      configState.defaultDraft
    );

    const listItem = $createExtendedListItemNode(
      configState.currentUser ?? undefined,
      configState.defaultDraft
    );
    listNode.append(listItem);

    if (children && children.length > 0) {
      listItem.append(...children);
    }

    parentNode.replace(listNode);

    if (!isImport) {
      listItem.select(0, 0);
    }
  },
  type: "element",
};
