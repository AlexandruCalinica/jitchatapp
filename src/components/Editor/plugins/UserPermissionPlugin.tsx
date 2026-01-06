import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  LexicalNode,
  $isLineBreakNode,
  $getState,
} from "lexical";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { $isQuoteNode } from "@lexical/rich-text";
import { userState } from "./nodeStates";
import { User, isSameUser } from "../shared/types";

export const checkNode = (node: LexicalNode, currentUser: User) => {
  const nodeUser = $getState(node, userState);

  if (!nodeUser) return false;

  if (!isSameUser(nodeUser, currentUser)) {
    return true;
  }

  return false;
};

const isInOthersContainer = (node: LexicalNode, currentUser: User): boolean => {
  let current: LexicalNode | null = node;
  while (current) {
    if ($isParagraphNode(current) || $isListItemNode(current) || $isListNode(current) || $isQuoteNode(current)) {
      const containerUser = $getState(current, userState);
      if (containerUser && !isSameUser(containerUser, currentUser)) {
        return true;
      }
    }
    current = current.getParent();
  }
  return false;
};

type UserPermissionPluginProps = {
  currentUser?: User;
};

export function UserPermissionPlugin({
  currentUser,
}: UserPermissionPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleDelete = (event: KeyboardEvent): boolean => {
      if (!currentUser) return false;

      let shouldPrevent = false;

      editor.getEditorState().read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) return;

        const nodes = selection.getNodes();

        for (const node of nodes) {
          if (checkNode(node, currentUser) || isInOthersContainer(node, currentUser)) {
            event.preventDefault();
            event.stopPropagation();
            shouldPrevent = true;
            return;
          }

          const checkNodeRecursively = (nodeToCheck: LexicalNode): boolean => {
            if ($isLineBreakNode(nodeToCheck)) {
              const previousSiblings = nodeToCheck.getPreviousSiblings();
              for (const sibling of previousSiblings) {
                if (checkNode(sibling, currentUser)) {
                  return true;
                }
              }
            }

            if (checkNode(nodeToCheck, currentUser)) {
              return true;
            }

            if ("getChildren" in nodeToCheck) {
              const children = (nodeToCheck as any).getChildren();
              for (const child of children) {
                if (checkNodeRecursively(child)) {
                  return true;
                }
              }
            }

            return false;
          };

          if (checkNodeRecursively(node)) {
            event.preventDefault();
            event.stopPropagation();
            shouldPrevent = true;
            return;
          }
        }
      });

      return shouldPrevent;
    };

    const handleBeforeInput = (event: InputEvent) => {
      if (!currentUser) return;

      editor.getEditorState().read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) return;

        const nodes = selection.getNodes();

        for (const node of nodes) {
          if (checkNode(node, currentUser) || isInOthersContainer(node, currentUser)) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          const checkNodeRecursively = (nodeToCheck: LexicalNode): boolean => {
            if ($isLineBreakNode(nodeToCheck)) {
              const previousSiblings = nodeToCheck.getPreviousSiblings();
              for (const sibling of previousSiblings) {
                if (checkNode(sibling, currentUser)) {
                  return true;
                }
              }
            }

            if (checkNode(nodeToCheck, currentUser)) {
              return true;
            }

            if ("getChildren" in nodeToCheck) {
              const children = (nodeToCheck as any).getChildren();
              for (const child of children) {
                if (checkNodeRecursively(child)) {
                  return true;
                }
              }
            }

            return false;
          };

          if (checkNodeRecursively(node)) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
        }
      });
    };

    const unregisterDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      handleDelete,
      COMMAND_PRIORITY_HIGH
    );

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      handleDelete,
      COMMAND_PRIORITY_HIGH
    );

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener("beforeinput", handleBeforeInput);
    }

    return () => {
      unregisterDelete();
      unregisterBackspace();
      if (rootElement) {
        rootElement.removeEventListener("beforeinput", handleBeforeInput);
      }
    };
  }, [editor, currentUser]);

  return null;
}
