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
} from "lexical";

import { $isExtendedTextNode } from "../nodes/ExtendedTextNode";
import { $isExtendedParagraphNode } from "../nodes/ExtendedParagraphNode";
import { userState, draftState, timestampState } from "./nodeStates";
import { User } from "../shared/types";

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
        const paragraphNode = $isParagraphNode(anchorNode)
          ? anchorNode
          : anchorNode.getParent();

        if (!paragraphNode || !$isExtendedParagraphNode(paragraphNode)) {
          return;
        }

        const paragraphUser = $getState(paragraphNode, userState);
        if (paragraphUser?.username !== currentUser.username) {
          return;
        }

        const timestamp = Date.now();
        let hasChanges = false;

        paragraphNode.getChildren().forEach((child) => {
          if ($isExtendedTextNode(child)) {
            const nodeUser = $getState(child, userState);
            const isDraft = $getState(child, draftState);

            if (nodeUser?.username === currentUser.username && isDraft !== false) {
              $setState(child, draftState, false);
              $setState(child, timestampState, timestamp);
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          const paragraphIsDraft = $getState(paragraphNode, draftState);
          if (paragraphIsDraft) {
            $setState(paragraphNode, draftState, false);
          }
          $setState(paragraphNode, timestampState, timestamp);
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
