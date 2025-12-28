import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  createCommand,
} from "lexical";
import {
  $isExtendedTextNode,
  $createExtendedTextNode,
} from "../nodes/ExtendedTextNode";
import { $getState } from "lexical";
import { userState, draftState } from "./nodeStates";

// Create a command for toggling draft mode
export const TOGGLE_DRAFT_COMMAND = createCommand("TOGGLE_DRAFT_COMMAND");

type DraftTogglePluginProps = {
  currentUser?: string;
  draftMode?: "always" | "default";
};

export function DraftTogglePlugin({
  currentUser,
  draftMode = "default",
}: DraftTogglePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleToggleDraft = () => {
      if (!currentUser) return false;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const nodes = selection.getNodes();
        let hasChanges = false;

        nodes.forEach((node) => {
          if ($isExtendedTextNode(node)) {
            const user = $getState(node, userState);
            const isDraft = $getState(node, draftState);

            if (user?.username === currentUser) {
              // Toggle draft mode for the current user's text nodes
              const newTextNode = $createExtendedTextNode(
                node.__text,
                user,
                !isDraft // Toggle the draft state
              );

              node.replace(newTextNode);
              hasChanges = true;
            }
          }
        });

        return hasChanges;
      });

      return true;
    };

    const unregisterToggleDraft = editor.registerCommand(
      TOGGLE_DRAFT_COMMAND,
      handleToggleDraft,
      COMMAND_PRIORITY_HIGH
    );

    // Register keyboard shortcut (Cmd+Shift+D or Ctrl+Shift+D)
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const isD = event.key === "d" || event.key === "D";

      if (isCmdOrCtrl && isShift && isD) {
        event.preventDefault();
        handleToggleDraft();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      unregisterToggleDraft();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, currentUser]);

  // Note: draftMode is now handled through the state management system
  // The default draft behavior is controlled by the individual nodes

  return null;
}
