import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

type TextBlurPluginProps = {
  currentUser?: string;
  unlockKey?: string;
};

export function TextBlurPlugin({
  currentUser,
  unlockKey = "Alt",
}: TextBlurPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isUnlockKeyPressed, setIsUnlockKeyPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === unlockKey) setIsUnlockKeyPressed(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === unlockKey) setIsUnlockKeyPressed(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [unlockKey]);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    if (isUnlockKeyPressed) {
      rootElement.setAttribute("data-peek", "true");
    } else {
      rootElement.removeAttribute("data-peek");
    }
  }, [editor, isUnlockKeyPressed]);

  useEffect(() => {
    if (!currentUser) return;

    const markOwnParagraphs = () => {
      const rootElement = editor.getRootElement();
      if (!rootElement) return;

      rootElement.querySelectorAll("p[data-user]").forEach((el) => {
        const user = el.getAttribute("data-user");
        if (user === currentUser) {
          el.setAttribute("data-own", "true");
        } else {
          el.removeAttribute("data-own");
        }
      });
    };

    markOwnParagraphs();

    const unregister = editor.registerUpdateListener(() => {
      setTimeout(markOwnParagraphs, 0);
    });

    return unregister;
  }, [editor, currentUser]);

  return null;
}
