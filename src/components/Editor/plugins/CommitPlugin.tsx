import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  $getState,
  $setState,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  LexicalNode,
  ElementNode,
} from "lexical";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { $isQuoteNode } from "@lexical/rich-text";

import { $isExtendedTextNode } from "../nodes/ExtendedTextNode";
import { $isExtendedParagraphNode } from "../nodes/ExtendedParagraphNode";
import { $isExtendedListItemNode } from "../nodes/ExtendedListItemNode";
import { $isExtendedListNode } from "../nodes/ExtendedListNode";
import { $isExtendedQuoteNode } from "../nodes/ExtendedQuoteNode";
import { $isExtendedImageNode, ExtendedImageNode } from "../nodes/ExtendedImageNode";
import { userState, draftState, timestampState } from "./nodeStates";
import { User, isSameUser } from "../shared/types";

export const COMMIT_MESSAGE_COMMAND = createCommand<void>(
  "COMMIT_MESSAGE_COMMAND"
);

type CommitPluginProps = {
  currentUser?: User;
};

export function CommitPlugin({ currentUser }: CommitPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!currentUser) return;

    const handleCommit = (): boolean => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        let containerNode: ElementNode | null = null;

        if ($isExtendedImageNode(anchorNode)) {
          const imageNode = anchorNode as ExtendedImageNode;
          const imageUser = $getState(imageNode, userState);
          if (isSameUser(imageUser, currentUser)) {
            const isDraft = $getState(imageNode, draftState);
            if (isDraft !== false) {
              const timestamp = Date.now();
              $setState(imageNode, draftState, false);
              $setState(imageNode, timestampState, timestamp);
            }
          }
          return;
        }

        if ($isParagraphNode(anchorNode) || $isListItemNode(anchorNode) || $isQuoteNode(anchorNode)) {
          containerNode = anchorNode as ElementNode;
        } else {
          const parent = anchorNode.getParent();
          if (parent && ($isParagraphNode(parent) || $isListItemNode(parent) || $isQuoteNode(parent))) {
            containerNode = parent;
          }
        }

        if (!containerNode) {
          return;
        }

        const isExtendedContainer = 
          $isExtendedParagraphNode(containerNode) || 
          $isExtendedListItemNode(containerNode) || 
          $isExtendedQuoteNode(containerNode);

        if (!isExtendedContainer) {
          return;
        }

        const containerUser = $getState(containerNode, userState);
        if (!isSameUser(containerUser, currentUser)) {
          return;
        }

        const timestamp = Date.now();
        let hasChanges = false;

        containerNode.getChildren().forEach((child: LexicalNode) => {
          if ($isExtendedTextNode(child)) {
            const nodeUser = $getState(child, userState);
            const isDraft = $getState(child, draftState);

            if (isSameUser(nodeUser, currentUser) && isDraft !== false) {
              $setState(child, draftState, false);
              $setState(child, timestampState, timestamp);
              hasChanges = true;
            }
          } else if ($isExtendedImageNode(child)) {
            const nodeUser = $getState(child, userState);
            const isDraft = $getState(child, draftState);

            if (isSameUser(nodeUser, currentUser) && isDraft !== false) {
              $setState(child, draftState, false);
              $setState(child, timestampState, timestamp);
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          const containerIsDraft = $getState(containerNode, draftState);
          if (containerIsDraft) {
            $setState(containerNode, draftState, false);
          }
          $setState(containerNode, timestampState, timestamp);

          if ($isListItemNode(containerNode)) {
            const listParent = containerNode.getParent();
            if (listParent && $isListNode(listParent) && $isExtendedListNode(listParent)) {
              const listUser = $getState(listParent, userState);
              if (isSameUser(listUser, currentUser)) {
                $setState(listParent, draftState, false);
                $setState(listParent, timestampState, timestamp);
              }
            }
          }
        }
      });

      return true;
    };

    const unregisterCommand = editor.registerCommand(
      COMMIT_MESSAGE_COMMAND,
      handleCommit,
      COMMAND_PRIORITY_HIGH
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isEnter = event.key === "Enter";

      if (isCmdOrCtrl && isEnter && !event.shiftKey) {
        event.preventDefault();
        editor.dispatchCommand(COMMIT_MESSAGE_COMMAND, undefined);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      unregisterCommand();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, currentUser]);

  return null;
}
