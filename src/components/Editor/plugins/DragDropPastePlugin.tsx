import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  $getState,
  LexicalNode,
} from "lexical";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { $isQuoteNode } from "@lexical/rich-text";
import { useEffect } from "react";

import { INSERT_IMAGE_COMMAND } from "./ImagesPlugin";
import { userState } from "./nodeStates";
import { configState } from "../shared/state";
import { uploadImage } from "../../../services/upload";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

function isMimeType(file: File, types: string[]): boolean {
  for (const type of types) {
    if (type.endsWith("/")) {
      if (file.type.startsWith(type)) {
        return true;
      }
    } else if (file.type === type) {
      return true;
    }
  }
  return false;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getImageSource(file: File): Promise<string> {
  const channelId = configState.channelId;
  if (!channelId) {
    return readFileAsDataUrl(file);
  }

  try {
    const uploaded = await uploadImage(file, channelId);
    return uploaded.url;
  } catch {
    return readFileAsDataUrl(file);
  }
}

function canInsertInCurrentSelection(editor: ReturnType<typeof useLexicalComposerContext>[0]): boolean {
  const currentUser = configState.currentUser;
  if (!currentUser) return false;

  let canInsert = true;

  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      canInsert = false;
      return;
    }

    const anchorNode = selection.anchor.getNode();
    let current: LexicalNode | null = anchorNode;

    while (current) {
      if ($isParagraphNode(current) || $isListItemNode(current) || $isListNode(current) || $isQuoteNode(current)) {
        const containerUser = $getState(current, userState);
        if (containerUser && containerUser.username !== currentUser.username) {
          canInsert = false;
          return;
        }
      }
      current = current.getParent();
    }
  });

  return canInsert;
}

export default function DragDropPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleDragOver = (e: DragEvent) => {
      const hasFiles = e.dataTransfer?.types.includes("Files");
      if (hasFiles) {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "copy";
        }
      }
    };

    const handleDrop = async (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter(file => 
        isMimeType(file, ACCEPTABLE_IMAGE_TYPES)
      );

      if (imageFiles.length === 0) return;

      if (!canInsertInCurrentSelection(editor)) return;

      e.preventDefault();
      e.stopPropagation();

      for (const file of imageFiles) {
        const src = await getImageSource(file);
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          src,
          altText: file.name,
        });
      }
    };

    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const imageFiles = Array.from(clipboardData.files).filter(file =>
        isMimeType(file, ACCEPTABLE_IMAGE_TYPES)
      );

      if (imageFiles.length > 0) {
        if (!canInsertInCurrentSelection(editor)) return;
        e.preventDefault();
        for (const file of imageFiles) {
          const src = await getImageSource(file);
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src,
            altText: file.name,
          });
        }
        return;
      }

      for (const item of clipboardData.items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            if (!canInsertInCurrentSelection(editor)) return;
            e.preventDefault();
            const src = await getImageSource(file);
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
              src,
              altText: "Pasted image",
            });
            return;
          }
        }
      }
    };

    rootElement.addEventListener("dragover", handleDragOver);
    rootElement.addEventListener("drop", handleDrop);
    rootElement.addEventListener("paste", handlePaste);

    return () => {
      rootElement.removeEventListener("dragover", handleDragOver);
      rootElement.removeEventListener("drop", handleDrop);
      rootElement.removeEventListener("paste", handlePaste);
    };
  }, [editor]);

  return null;
}
