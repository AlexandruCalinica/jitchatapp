import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  LexicalNode,
  $isLineBreakNode,
  $getState,
} from "lexical";
import { userState } from "./nodeStates";

export const checkNode = (node: LexicalNode, currentUser: string) => {
  const nodeUser = $getState(node, userState);

  if (!nodeUser) return false;

  if (nodeUser.username !== currentUser) {
    return true;
  }

  return false;
};

type UserPermissionPluginProps = {
  currentUser?: string;
};

export function UserPermissionPlugin({
  currentUser,
}: UserPermissionPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleDelete = (event: KeyboardEvent) => {
      if (!currentUser) return false;

      let shouldPrevent = false;

      editor.getEditorState().read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) return;

        // Get all nodes in the selection
        const nodes = selection.getNodes();

        // Check if any of the selected nodes are ExtendedTextNodes that don't belong to the current user
        for (const node of nodes) {
          if (checkNode(node, currentUser)) {
            // Prevent deletion by stopping the event
            event.preventDefault();
            event.stopPropagation();
            shouldPrevent = true;
            return;
          }

          // Also check child nodes recursively
          const checkNodeRecursively = (nodeToCheck: LexicalNode): boolean => {
            if ($isLineBreakNode(nodeToCheck)) {
              const previousSiblings = nodeToCheck.getPreviousSiblings();
              for (const node of previousSiblings) {
                if (checkNode(node, currentUser)) {
                  return true;
                }
              }
            }

            if (checkNode(nodeToCheck, currentUser)) {
              return true;
            }

            // Check if the node has children (ElementNode)
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

        // Get all nodes in the selection
        const nodes = selection.getNodes();

        // Check if any of the selected nodes are ExtendedTextNodes that don't belong to the current user
        for (const node of nodes) {
          if (checkNode(node, currentUser)) {
            // Prevent typing by stopping the event
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          // Also check child nodes recursively
          const checkNodeRecursively = (nodeToCheck: LexicalNode): boolean => {
            if ($isLineBreakNode(nodeToCheck)) {
              const previousSiblings = nodeToCheck.getPreviousSiblings();
              for (const node of previousSiblings) {
                if (checkNode(node, currentUser)) {
                  return true;
                }
              }
            }

            if (checkNode(nodeToCheck, currentUser)) {
              return true;
            }

            // Check if the node has children (ElementNode)
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

    // Register command handlers for DELETE and BACKSPACE
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

    // Add beforeinput event listener to prevent typing
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
