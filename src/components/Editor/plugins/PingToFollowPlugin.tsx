import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_HIGH, createCommand } from "lexical";

import { PingMenu } from "../components/PingMenu";
import { useFollowChannelOptional } from "../contexts/FollowChannelContext";

export const OPEN_PING_MENU_COMMAND = createCommand("OPEN_PING_MENU_COMMAND");

export function PingToFollowPlugin() {
  const [editor] = useLexicalComposerContext();
  const followContext = useFollowChannelOptional();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | undefined>();

  const openMenu = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setMenuPosition({
        x: Math.max(10, rect.left),
        y: Math.max(10, rect.bottom + 8),
      });
    } else {
      setMenuPosition(undefined);
    }
    setIsMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setMenuPosition(undefined);
  }, []);

  const handleSendPing = useCallback(
    (targets: string[] | "all") => {
      followContext?.sendPing(targets);
    },
    [followContext]
  );

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      OPEN_PING_MENU_COMMAND,
      () => {
        openMenu();
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const isP = event.key === "p" || event.key === "P";

      if (isCmdOrCtrl && isShift && isP) {
        event.preventDefault();
        event.stopPropagation();
        openMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      unregisterCommand();
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [editor, openMenu]);

  if (!followContext) {
    return null;
  }

  return createPortal(
    <PingMenu
      isOpen={isMenuOpen}
      onClose={closeMenu}
      onlineUsers={followContext.onlineUsers}
      onSendPing={handleSendPing}
      position={menuPosition}
      currentDocId={followContext.currentDocId}
    />,
    document.body
  );
}
