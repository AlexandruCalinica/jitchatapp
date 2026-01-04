import { useEffect } from "react";
import { $setState, $getState } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { User } from "../shared/types";
import { configState } from "../shared/state";
import { userState, draftState } from "./nodeStates";
import { ExtendedListItemNode } from "../nodes/ExtendedListItemNode";
import { ExtendedListNode } from "../nodes/ExtendedListNode";
import { ExtendedQuoteNode } from "../nodes/ExtendedQuoteNode";
import { ExtendedImageNode } from "../nodes/ExtendedImageNode";

type NodeTransformPluginProps = {
  currentUser?: User;
};

export function NodeTransformPlugin({
  currentUser,
}: NodeTransformPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListTransform = editor.registerNodeTransform(
      ExtendedListNode,
      (node) => {
        const existingUser = $getState(node, userState);

        if (!existingUser) {
          const user = currentUser || configState.currentUser;
          if (user) {
            $setState(node, userState, user);
            $setState(node, draftState, configState.defaultDraft);
          }
        }
      }
    );

    const removeListItemTransform = editor.registerNodeTransform(
      ExtendedListItemNode,
      (node) => {
        const existingUser = $getState(node, userState);

        if (!existingUser) {
          const user = currentUser || configState.currentUser;
          if (user) {
            $setState(node, userState, user);
            $setState(node, draftState, configState.defaultDraft);
          }
        }
      }
    );

    const removeQuoteTransform = editor.registerNodeTransform(
      ExtendedQuoteNode,
      (node) => {
        const existingUser = $getState(node, userState);

        if (!existingUser) {
          const user = currentUser || configState.currentUser;
          if (user) {
            $setState(node, userState, user);
            $setState(node, draftState, configState.defaultDraft);
          }
        }
      }
    );

    const removeImageTransform = editor.registerNodeTransform(
      ExtendedImageNode,
      (node) => {
        const existingUser = $getState(node, userState);

        if (!existingUser) {
          const user = currentUser || configState.currentUser;
          if (user) {
            $setState(node, userState, user);
            $setState(node, draftState, configState.defaultDraft);
          }
        }
      }
    );

    return () => {
      removeListTransform();
      removeListItemTransform();
      removeQuoteTransform();
      removeImageTransform();
    };
  }, [editor, currentUser]);

  return null;
}
