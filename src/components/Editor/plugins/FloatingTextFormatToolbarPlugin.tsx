import { createPortal } from "react-dom";
import { useRef, useState, useEffect, useCallback, KeyboardEvent } from "react";

import { $setBlocksType } from "@lexical/selection";
import { $isLinkNode, $toggleLink } from "@lexical/link";
import { shift, offset, computePosition } from "@floating-ui/dom";
import { $isQuoteNode, $createQuoteNode } from "@lexical/rich-text";
import { $isListNode, $createListNode, $isListItemNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalNode,
  $getSelection,
  $isRangeSelection,
  KEY_ESCAPE_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  $createParagraphNode,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_NORMAL,
  COMMAND_PRIORITY_NORMAL as NORMAL_PRIORITY,
  SELECTION_CHANGE_COMMAND as ON_SELECTION_CHANGE,
} from "lexical";

import BoldIcon from "~icons/icon-park-outline/text-bold";
import ItalicIcon from "~icons/icon-park-outline/text-italic";
import StrikethroughIcon from "~icons/icon-park-outline/strikethrough";
import LinkIcon from "~icons/icon-park-outline/link-two";
import BlockQuoteIcon from "~icons/icon-park-outline/quote";
import DraftIcon from "~icons/icon-park-outline/edit-one";

import ListBulletedIcon from "~icons/icon-park-outline/list-two";
import ListNumberedIcon from "~icons/icon-park-outline/ordered-list";
import ListCheckboxIcon from "~icons/icon-park-outline/list-checkbox";

import { Tooltip } from "../../Tooltip";
import { FloatingToolbarButton } from "../components";
import { getSelectedNode } from "../utils/getSelectedNode";

import { usePointerInteractions } from "./../utils/usePointerInteractions";
import { TOGGLE_DRAFT_COMMAND } from "./DraftTogglePlugin";
import { $isExtendedTextNode } from "../nodes/ExtendedTextNode";
import { $getState } from "lexical";
import { draftState } from "./nodeStates";

const DEFAULT_DOM_ELEMENT = document.body;

type FloatingMenuCoords = { x: number; y: number } | undefined;

export type FloatingMenuComponentProps = {
  variableOptions: string[];
  editor: ReturnType<typeof useLexicalComposerContext>[0];
};

export type FloatingMenuPluginProps = {
  element?: HTMLElement;
  variableOptions: string[];
};

export function FloatingMenu({ editor }: FloatingMenuComponentProps) {
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBlockquote, setIsBlockquote] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);
  const [isUnorderedList, setIsUnorderedList] = useState(false);
  const [isCheckList, setIsCheckList] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleLink = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        if (isLink) {
          $toggleLink(null);
        } else {
          $toggleLink("https://");
          setTimeout(() => {
            const input = document.querySelector("#container-link-input input");
            if (input) {
              (input as HTMLInputElement).focus();
            }
          }, 100);
        }
      }
    });
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if (!isBlockquote) {
        $setBlocksType(selection, $createQuoteNode);
      } else {
        $setBlocksType(selection, $createParagraphNode);
      }
    });
  }, [editor, isBlockquote]);

  const toggleOrderedList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if (!isOrderedList) {
        $setBlocksType(selection, () => $createListNode("number"));
      } else {
        $setBlocksType(selection, $createParagraphNode);
      }
    });
  }, [editor, isOrderedList]);

  const toggleCheckList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if (!isCheckList) {
        $setBlocksType(selection, () => $createListNode("check"));
      } else {
        $setBlocksType(selection, $createParagraphNode);
      }
    });
  }, [editor, isCheckList]);

  const toggleUnorderedList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if (!isUnorderedList) {
        $setBlocksType(selection, () => $createListNode("bullet"));
      } else {
        $setBlocksType(selection, $createParagraphNode);
      }
    });
  }, [editor, isUnorderedList]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          setIsStrikethrough(selection.hasFormat("strikethrough"));
          setIsBold(selection.hasFormat("bold"));
          setIsItalic(selection.hasFormat("italic"));
          setIsBlockquote(
            selection
              .getNodes()
              .some((n) => $isQuoteNode(n) || $isQuoteNode(n.getParent()))
          );
          setIsDraft(
            selection
              .getNodes()
              .every((n) => $isExtendedTextNode(n) && $getState(n, draftState))
          );

          let isUnordered = false;
          let isOrdered = false;
          let isCheck = false;

          selection.getNodes().forEach((node) => {
            let currentNode: LexicalNode | null = node;

            while (currentNode != null) {
              if ($isListItemNode(currentNode)) {
                const parent = currentNode.getParent();

                if ($isListNode(parent)) {
                  if (parent.getListType() === "bullet") {
                    isUnordered = true;
                  } else if (parent.getListType() === "number") {
                    isOrdered = true;
                  } else if (parent.getListType() === "check") {
                    isCheck = true;
                  }
                }
              }

              // Move to parent node to continue checking
              currentNode = currentNode.getParent() as LexicalNode | null;
            }
          });

          setIsUnorderedList(isUnordered);
          setIsOrderedList(isOrdered);
          setIsCheckList(isCheck);

          const node = getSelectedNode(selection);

          // Update links
          const parent = node.getParent();

          if ($isLinkNode(parent) || $isLinkNode(node)) {
            setIsLink(true);
          } else {
            setIsLink(false);
          }
        }
      });
    });
  }, [editor]);

  return (
    <div
      ref={menuRef}
      className="flex items-center justify-between bg-gray-700 text-gray-25 border-[1px] border-gray-200 rounded-md p-1 gap-1"
    >
      <>
        <Tooltip label="Bold: ⌘ + B">
          <div>
            <FloatingToolbarButton
              active={isBold}
              aria-label="Format text to bold"
              icon={<BoldIcon className="text-gray-100" />}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
              }}
            />
          </div>
        </Tooltip>
        <Tooltip label="Italic: ⌘ + I">
          <div>
            <FloatingToolbarButton
              active={isItalic}
              aria-label="Format text with italic"
              icon={<ItalicIcon className="text-gray-100" />}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
              }}
            />
          </div>
        </Tooltip>
        <Tooltip label="Strikethrough: ⌘ + S">
          <div>
            <FloatingToolbarButton
              active={isStrikethrough}
              aria-label="Format text with a strikethrough"
              icon={<StrikethroughIcon className="text-gray-100" />}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
              }}
            />
          </div>
        </Tooltip>
        <div>
          <FloatingToolbarButton
            active={isUnorderedList}
            onClick={toggleUnorderedList}
            aria-label="Format text as an bullet list"
            icon={<ListBulletedIcon className="text-gray-100" />}
          />
        </div>
        <div>
          <FloatingToolbarButton
            active={isOrderedList}
            onClick={toggleOrderedList}
            aria-label="Format text as an ordered list"
            icon={<ListNumberedIcon className="text-gray-100" />}
          />
        </div>
        <div>
          <FloatingToolbarButton
            active={isCheckList}
            onClick={toggleCheckList}
            aria-label="Format text as a check list"
            icon={<ListCheckboxIcon className="text-inherit" />}
          />
        </div>
        <Tooltip label="Link: ⌘ + K">
          <div>
            <FloatingToolbarButton
              active={isLink}
              onClick={toggleLink}
              aria-label="Insert or remove link"
              icon={<LinkIcon className="text-gray-100" />}
            />
          </div>
        </Tooltip>
        <div>
          <FloatingToolbarButton
            active={isBlockquote}
            onClick={toggleBlockquote}
            aria-label="Format text with block quote"
            icon={<BlockQuoteIcon className="text-gray-100" />}
          />
        </div>
        <div>
          <FloatingToolbarButton
            active={isDraft}
            onClick={() => {
              editor.dispatchCommand(TOGGLE_DRAFT_COMMAND, undefined);
            }}
            aria-label="Toggle draft mode"
            icon={<DraftIcon className="text-gray-100" />}
          />
        </div>
      </>
    </div>
  );
}

export function FloatingMenuPlugin({
  element,
  variableOptions,
}: FloatingMenuPluginProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<FloatingMenuCoords>(undefined);
  const show = coords !== undefined;

  const [editor] = useLexicalComposerContext();
  const { isPointerDown, isPointerReleased } = usePointerInteractions();

  const calculatePosition = useCallback(() => {
    const domSelection = getSelection();
    const domRange =
      domSelection?.rangeCount !== 0 && domSelection?.getRangeAt(0);

    if (!domRange || !ref.current || isPointerDown) return setCoords(undefined);

    computePosition(domRange, ref.current, {
      placement: "top",
      middleware: [offset(8), shift()],
    })
      .then((pos) => {
        setCoords({ x: pos.x, y: pos.y });
      })
      .catch(() => {
        setCoords(undefined);
      });
  }, [isPointerDown]);

  const $handleSelectionChange = useCallback(() => {
    if (editor.isComposing()) {
      return false;
    }

    if (editor.getRootElement() !== document.activeElement) {
      setCoords(undefined);

      return true;
    }

    const selection = $getSelection();

    if ($isRangeSelection(selection) && !selection.anchor.is(selection.focus)) {
      const node = getSelectedNode(selection);

      if ($isLinkNode(node)) {
        setCoords(undefined);

        return false;
      }
      calculatePosition();
    } else {
      setCoords(undefined);
    }

    return false;
  }, [editor, calculatePosition]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (ref.current && !ref.current?.contains(event.target as Node)) {
        editor.update(() => {
          setCoords(undefined);
        });
      }
    },
    [editor]
  );

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      ON_SELECTION_CHANGE,
      $handleSelectionChange,
      NORMAL_PRIORITY
    );

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unregisterCommand();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editor, $handleSelectionChange, handleClickOutside]);

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setCoords(undefined);

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return unregisterCommand;
  }, [editor]);

  useEffect(() => {
    const removeKeyboardHandler = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        if (event.key === "s" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");

          return true;
        }

        if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
          editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              $toggleLink("");
            }
          });

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );

    return () => {
      removeKeyboardHandler();
    };
  }, [editor]);

  useEffect(() => {
    if (!show && isPointerReleased) {
      editor.getEditorState().read(() => {
        $handleSelectionChange();
      });
    }
  }, [isPointerReleased, $handleSelectionChange, editor]);

  return createPortal(
    <div
      ref={ref}
      aria-hidden={!show}
      style={{
        position: "absolute",
        zIndex: 9999,
        top: coords?.y,
        left: coords?.x,
        visibility: show ? "visible" : "hidden",
        opacity: show ? 1 : 0,
      }}
    >
      <FloatingMenu editor={editor} variableOptions={variableOptions} />
    </div>,
    element ?? DEFAULT_DOM_ELEMENT
  );
}
