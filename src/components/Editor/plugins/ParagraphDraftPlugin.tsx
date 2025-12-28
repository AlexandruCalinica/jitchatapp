import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useConfigState } from "../shared/state";

type ParagraphDraftPluginProps = {
  currentUser?: string;
  unlockKey?: string; // The key that unlocks collapsed paragraphs (default: 'Alt')
  showIndicator?: boolean; // Show visual indicator when unlock key is pressed (default: true)
};

export function ParagraphDraftPlugin({
  currentUser,
  unlockKey = "Alt",
  showIndicator = true,
}: ParagraphDraftPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [config] = useConfigState();
  const [isUnlockKeyPressed, setIsUnlockKeyPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === unlockKey) {
        setIsUnlockKeyPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === unlockKey) {
        setIsUnlockKeyPressed(false);
      }
    };

    // Add global event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [unlockKey]);

  useEffect(() => {
    const updateParagraphStyles = () => {
      if (!currentUser || !config.collapseDraftParagraphs) return;

      const rootElement = editor.getRootElement();
      if (!rootElement) return;

      // Find all paragraph elements
      const paragraphElements = rootElement.querySelectorAll("p");

      paragraphElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const user = htmlElement.getAttribute("data-user");
        const isCurrentUser = user === currentUser;

        // Check if this paragraph contains any draft text nodes from other users
        const draftTextNodes = htmlElement.querySelectorAll(
          "span[data-draft='true'][data-user]"
        );
        const hasOtherUserDraftText = Array.from(draftTextNodes).some(
          (textNode) => textNode.getAttribute("data-user") !== currentUser
        );

        if (isCurrentUser) {
          // Always show current user's paragraphs (both draft and published)
          htmlElement.style.height = "auto";
          htmlElement.style.overflow = "visible";
          htmlElement.style.transition = "height 0.2s ease-in-out";
          htmlElement.style.backgroundColor = "#f0f0f0";
        } else if (hasOtherUserDraftText) {
          // Only collapse paragraphs that contain draft text from other users
          if (isUnlockKeyPressed) {
            htmlElement.style.height = "auto";
            htmlElement.style.overflow = "visible";
            if (showIndicator) {
              htmlElement.style.outline = "2px solid #3b82f6";
              htmlElement.style.outlineOffset = "1px";
            }
          } else {
            htmlElement.style.height = "0";
            htmlElement.style.overflow = "hidden";
            htmlElement.style.outline = "";
            htmlElement.style.outlineOffset = "";
          }
          htmlElement.style.transition =
            "height 0.2s ease-in-out, outline 0.2s ease-in-out";
        } else {
          // Published paragraphs from other users are not collapsed
          htmlElement.style.height = "auto";
          htmlElement.style.overflow = "visible";
          htmlElement.style.outline = "";
          htmlElement.style.outlineOffset = "";
          htmlElement.style.transition =
            "height 0.2s ease-in-out, outline 0.2s ease-in-out";
        }
      });
    };

    // Update styles immediately
    updateParagraphStyles();

    // Subscribe to editor updates to reapply styles when content changes
    const unregisterUpdateListener = editor.registerUpdateListener(() => {
      // Use setTimeout to ensure DOM is updated
      setTimeout(updateParagraphStyles, 0);
    });

    return () => {
      unregisterUpdateListener();
    };
  }, [
    editor,
    currentUser,
    isUnlockKeyPressed,
    config.collapseDraftParagraphs,
    showIndicator,
  ]);

  // Add visual indicator to the editor when unlock key is pressed
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement || !showIndicator || !config.collapseDraftParagraphs)
      return;

    if (isUnlockKeyPressed) {
      rootElement.style.position = "relative";
      const indicator = document.createElement("div");
      indicator.id = "paragraph-unlock-indicator";
      indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #3b82f6;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0.9;
      `;
      indicator.textContent = `Hold ${unlockKey} to view others' draft paragraphs`;
      rootElement.appendChild(indicator);
    } else {
      const indicator = rootElement.querySelector(
        "#paragraph-unlock-indicator"
      );
      if (indicator) {
        indicator.remove();
      }
    }

    return () => {
      const indicator = rootElement.querySelector(
        "#paragraph-unlock-indicator"
      );
      if (indicator) {
        indicator.remove();
      }
    };
  }, [
    isUnlockKeyPressed,
    editor,
    unlockKey,
    showIndicator,
    config.collapseDraftParagraphs,
  ]);

  return null;
}
