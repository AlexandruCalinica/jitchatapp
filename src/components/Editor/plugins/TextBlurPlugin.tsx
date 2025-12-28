import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical";
import { $isExtendedTextNode } from "../nodes/ExtendedTextNode";

type TextBlurPluginProps = {
  currentUser?: string;
  unlockKey?: string; // The key that unlocks blurred text (default: 'Alt')
  blurAmount?: string; // CSS filter blur amount (default: '2px')
  showIndicator?: boolean; // Show visual indicator when unlock key is pressed (default: true)
};

export function TextBlurPlugin({
  currentUser,
  unlockKey = "Alt",
  blurAmount = "2px",
  showIndicator = true,
}: TextBlurPluginProps) {
  const [editor] = useLexicalComposerContext();
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
    const updateBlurStyles = () => {
      if (!currentUser) return;

      const rootElement = editor.getRootElement();
      if (!rootElement) return;

      // Find all text nodes with data-user attribute
      const textElements = rootElement.querySelectorAll("span[data-user]");

      textElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const user = htmlElement.getAttribute("data-user");
        const isDraft = htmlElement.getAttribute("data-draft") === "true";
        const isCurrentUser = user === currentUser;

        if (isCurrentUser) {
          // Remove blur for current user's text (both draft and published)
          htmlElement.style.filter = "";
          htmlElement.style.transition = "filter 0.2s ease-in-out";
        } else {
          // Only blur draft text from other users
          if (isDraft) {
            if (isUnlockKeyPressed) {
              htmlElement.style.filter = "";
              if (showIndicator) {
                htmlElement.style.outline = "2px solid #3b82f6";
                htmlElement.style.outlineOffset = "1px";
              }
            } else {
              htmlElement.style.filter = `blur(${blurAmount})`;
              htmlElement.style.outline = "";
              htmlElement.style.outlineOffset = "";
            }
            htmlElement.style.transition =
              "filter 0.2s ease-in-out, outline 0.2s ease-in-out";
          } else {
            // Published text from other users is not blurred
            htmlElement.style.filter = "";
            htmlElement.style.outline = "";
            htmlElement.style.outlineOffset = "";
            htmlElement.style.transition =
              "filter 0.2s ease-in-out, outline 0.2s ease-in-out";
          }
        }
      });
    };

    // Update styles immediately
    updateBlurStyles();

    // Subscribe to editor updates to reapply styles when content changes
    const unregisterUpdateListener = editor.registerUpdateListener(() => {
      // Use setTimeout to ensure DOM is updated
      setTimeout(updateBlurStyles, 0);
    });

    return () => {
      unregisterUpdateListener();
    };
  }, [editor, currentUser, isUnlockKeyPressed, blurAmount, showIndicator]);

  // Add visual indicator to the editor when unlock key is pressed
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement || !showIndicator) return;

    if (isUnlockKeyPressed) {
      rootElement.style.position = "relative";
      const indicator = document.createElement("div");
      indicator.id = "unlock-indicator";
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
      indicator.textContent = `Hold ${unlockKey} to view others' draft text`;
      rootElement.appendChild(indicator);
    } else {
      const indicator = rootElement.querySelector("#unlock-indicator");
      if (indicator) {
        indicator.remove();
      }
    }

    return () => {
      const indicator = rootElement.querySelector("#unlock-indicator");
      if (indicator) {
        indicator.remove();
      }
    };
  }, [isUnlockKeyPressed, editor, unlockKey, showIndicator]);

  return null;
}
