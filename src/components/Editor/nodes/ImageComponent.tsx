import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";

import { configState } from "../shared/state";
import { User, isSameUser } from "../shared/types";
import { $isExtendedImageNode } from "./ExtendedImageNode";

interface ImageComponentProps {
  src: string;
  altText: string;
  width: "inherit" | number;
  height: "inherit" | number;
  maxWidth: number;
  nodeKey: NodeKey;
  user?: User;
  isDraft?: boolean;
  timestamp?: number;
}

export default function ImageComponent({
  src,
  altText,
  width,
  height,
  maxWidth,
  nodeKey,
  user,
  isDraft,
}: ImageComponentProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [editor] = useLexicalComposerContext();
  const [isLoadError, setIsLoadError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentUser = configState.currentUser;
  const isOwner = isSameUser(user, currentUser);

  const deleteNode = useCallback(() => {
    if (!isOwner) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isExtendedImageNode(node)) {
        node.remove();
      }
    });
  }, [editor, nodeKey, isOwner]);

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (!isOwner) return false;
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isExtendedImageNode(node)) {
          node.remove();
          return true;
        }
      }
      return false;
    },
    [isSelected, nodeKey, isOwner]
  );

  const handleContainerClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isOwner) return;
      event.stopPropagation();
      if (event.shiftKey) {
        setSelected(!isSelected);
      } else {
        clearSelection();
        setSelected(true);
      }
    },
    [clearSelection, isSelected, setSelected, isOwner]
  );

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      deleteNode();
    },
    [deleteNode]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, $onDelete]);

  const handleError = useCallback(() => {
    setIsLoadError(true);
  }, []);

  const showDeleteButton = isOwner && (isSelected || isHovered);

  if (isLoadError) {
    return (
      <div
        style={{
          display: "block",
          position: "relative",
          maxWidth: `${maxWidth}px`,
        }}
        data-user={user?.username}
        data-draft={isDraft ? "true" : undefined}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "200px",
            height: "100px",
            backgroundColor: "#f3f4f6",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >
          Failed to load image
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "inline-block",
        position: "relative",
        maxWidth: `${maxWidth}px`,
        cursor: isOwner ? "pointer" : "default",
      }}
      data-user={user?.username}
      data-draft={isDraft ? "true" : undefined}
    >
      <img
        src={src}
        alt={altText}
        style={{
          display: "block",
          maxWidth: "100%",
          width: width === "inherit" ? "auto" : `${width}px`,
          height: height === "inherit" ? "auto" : `${height}px`,
          outline: isOwner && isSelected ? "2px solid var(--user-color, #3b82f6)" : "none",
        }}
        onError={handleError}
        draggable={false}
      />
      {showDeleteButton && (
        <button
          onClick={handleDeleteClick}
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "20px",
            height: "20px",
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            lineHeight: 1,
          }}
          title="Delete image"
        >
          ×
        </button>
      )}
    </div>
  );
}
