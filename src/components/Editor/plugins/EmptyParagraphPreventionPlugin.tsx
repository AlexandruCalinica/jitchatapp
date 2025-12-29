import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getState,
  $setState,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  INSERT_LINE_BREAK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  INSERT_PARAGRAPH_COMMAND,
} from "lexical";

import { userState } from "./nodeStates";
import {
  $createExtendedParagraphNode,
  ExtendedParagraphNode,
} from "../nodes/ExtendedParagraphNode";
import { User } from "../shared/types";
import { configState } from "../shared/state";

type EmptyParagraphPreventionPluginProps = {
  enabled?: boolean; // Whether to enable the prevention (default: true)
  currentUser?: User;
};

export function EmptyParagraphPreventionPlugin({
  enabled = true,
  currentUser,
}: EmptyParagraphPreventionPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!enabled) return;
    if (!currentUser) return;

    const ensureFallbackParagraphUserState = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        // Check if we have any paragraphs without user state
        children.forEach((child) => {
          if (
            $isParagraphNode(child) &&
            child instanceof ExtendedParagraphNode
          ) {
            const existingUserState = $getState(child, userState);

            // If this paragraph has no user state and we have a current user, set it
            if (!existingUserState && currentUser) {
              editor.update(() => {
                $setState(child, userState, currentUser);
              });
            } else if (typeof existingUserState === "string") {
              editor.update(() => {
                $setState(child, userState, currentUser);
              });
            }
          }
        });
      });
    };

    const handleParagraphInsert = (_event: KeyboardEvent) => {
      const shouldHandle = editor.getEditorState().read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        // Get the current paragraph node
        const anchorNode = selection.anchor.getNode();
        const paragraphNode = $isParagraphNode(anchorNode)
          ? anchorNode
          : anchorNode.getParent();

        const nextSiblingNode = paragraphNode?.getNextSibling();

        if (nextSiblingNode) {
          const nextSiblingText = nextSiblingNode.getTextContent().trim();

          if (nextSiblingText === "") {
            return true;
          }
        }

        if (!$isParagraphNode(paragraphNode)) {
          return false;
        }

        if (paragraphNode) {
          const paragraphNodeUserState = $getState(paragraphNode, userState);

          if (paragraphNodeUserState?.username !== currentUser.username) {
            return true;
          }
        }

        // Check if the paragraph is empty or contains only whitespace
        const paragraphText = paragraphNode.getTextContent().trim();

        if (paragraphText === "") {
          // Prevent the default Enter behavior by returning true
          return true;
        }

        return false;
      });

      if (shouldHandle) {
        // Now handle the creation and selection in update mode
        editor.update(() => {
          const root = $getRoot();
          const newParagraph = $createExtendedParagraphNode(currentUser, configState.defaultDraft);

          // Insert the new paragraph at the end
          root.append(newParagraph);

          newParagraph.selectStart();
        });

        return true;
      }

      return false;
    };

    const handleLineBreakInsert = (_event: KeyboardEvent) => {
      // First, check the current state in read mode
      const shouldHandle = editor.getEditorState().read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const paragraphNode = $isParagraphNode(anchorNode)
          ? anchorNode
          : anchorNode.getParent();

        if (!$isParagraphNode(paragraphNode)) {
          return false;
        }

        const paragraphNodeUserState = $getState(paragraphNode, userState);

        return paragraphNodeUserState?.username !== currentUser.username;
      });

      if (shouldHandle) {
        // Now handle the creation and selection in update mode
        editor.update(() => {
          const root = $getRoot();
          const newParagraph = $createExtendedParagraphNode(currentUser, configState.defaultDraft);

          // Insert the new paragraph at the end
          root.append(newParagraph);

          newParagraph.selectStart();
        });

        return true;
      }

      return false;
    };

    // Register the command handler with CRITICAL priority
    const unregisterParagraphInsertCommand = editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      handleParagraphInsert,
      COMMAND_PRIORITY_CRITICAL
    );

    const unregisterLineBreakInsertCommand = editor.registerCommand(
      INSERT_LINE_BREAK_COMMAND,
      handleLineBreakInsert,
      COMMAND_PRIORITY_CRITICAL
    );

    const unregisterUpdateListener = editor.registerUpdateListener(() => {
      setTimeout(ensureFallbackParagraphUserState, 0);
    });

    return () => {
      unregisterParagraphInsertCommand();
      unregisterLineBreakInsertCommand();
      unregisterUpdateListener();
    };
  }, [editor, enabled, currentUser]);

  return null;
}
