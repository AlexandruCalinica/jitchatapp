import type { JSX } from "react";

import { $createCodeNode } from "@lexical/code";
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
// import { INSERT_EMBED_COMMAND } from "@lexical/react/LexicalAutoEmbedPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  LexicalEditor,
  TextNode,
} from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import ParagraphIcon from "~icons/icon-park-outline/paragraph-alphabet";
import H1Icon from "~icons/icon-park-outline/h1";
import H2Icon from "~icons/icon-park-outline/h2";
import H3Icon from "~icons/icon-park-outline/h3";
import ListNumbersIcon from "~icons/icon-park-outline/list-numbers";
import ListUnorderedIcon from "~icons/icon-park-outline/list-two";
import CheckListIcon from "~icons/icon-park-outline/list-checkbox";
import QuoteIcon from "~icons/icon-park-outline/quote";
import CodeIcon from "~icons/icon-park-outline/code";
import DividerIcon from "~icons/icon-park-outline/dividing-line-one";
import AlignLeftIcon from "~icons/icon-park-outline/align-text-left";
import AlignCenterIcon from "~icons/icon-park-outline/align-text-center";
import AlignRightIcon from "~icons/icon-park-outline/align-text-right";
import AlignJustifyIcon from "~icons/icon-park-outline/align-text-both";
import DraftIcon from "~icons/icon-park-outline/edit-one";

import { cn } from "../../../util/cn";
import { TOGGLE_DRAFT_COMMAND } from "./DraftTogglePlugin";

import ImageIcon from "~icons/icon-park-outline/picture-one";
import { INSERT_IMAGE_COMMAND } from "./ImagesPlugin";

class ComponentPickerOption extends MenuOption {
  // What shows up in the editor
  title: string;
  // Icon for display
  icon?: JSX.Element;
  // For extra searching.
  keywords: Array<string>;
  // TBD
  keyboardShortcut?: string;
  // What happens when you select this option?
  onSelect: (queryString: string) => void;

  constructor(
    title: string,
    options: {
      icon?: JSX.Element;
      keywords?: Array<string>;
      keyboardShortcut?: string;
      onSelect: (queryString: string) => void;
    }
  ) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
  }
}

function ComponentPickerMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: ComponentPickerOption;
}) {
  let className = "item";
  if (isSelected) {
    className += " selected";
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={cn(
        "flex gap-2 items-center text-start py-[6px] px-[10px] leading-[18px] text-zed-fg  rounded-sm outline-none cursor-pointer hover:bg-zed-active hover:rounded-md ",
        "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed hover:data-[disabled]:bg-transparent",
        isSelected && "bg-zed-active text-zed-fg"
      )}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={"typeahead-item-" + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {option.icon}
      <span className="text">{option.title}</span>
    </li>
  );
}

function getDynamicOptions(editor: LexicalEditor, queryString: string) {
  const options: Array<ComponentPickerOption> = [];

  if (queryString == null) {
    return options;
  }

  const tableMatch = queryString.match(/^([1-9]\d?)(?:x([1-9]\d?)?)?$/);

  if (tableMatch !== null) {
    const rows = tableMatch[1];
    const colOptions = tableMatch[2]
      ? [tableMatch[2]]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String);

    options.push(
      ...colOptions.map(
        (columns) =>
          new ComponentPickerOption(`${rows}x${columns} Table`, {
            icon: <i className="icon table" />,
            keywords: ["table"],
            onSelect: () =>
              editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
          })
      )
    );
  }

  return options;
}

// type ShowModal = ReturnType<typeof useModal>[1];

function getBaseOptions(editor: LexicalEditor, _showModal: any) {
  return [
    new ComponentPickerOption("Paragraph", {
      icon: <ParagraphIcon />,
      keywords: ["normal", "paragraph", "p", "text"],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        }),
    }),
    ...([1, 2, 3] as const).map(
      (n) =>
        new ComponentPickerOption(`Heading ${n}`, {
          icon: n === 1 ? <H1Icon /> : n === 2 ? <H2Icon /> : <H3Icon />,
          keywords: ["heading", "header", `h${n}`],
          onSelect: () =>
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(`h${n}`));
              }
            }),
        })
    ),
    // new ComponentPickerOption("Table", {
    //   icon: <i className="icon table" />,
    //   keywords: ["table", "grid", "spreadsheet", "rows", "columns"],
    //   onSelect: () =>
    //     showModal("Insert Table", (onClose) => (
    //       <InsertTableDialog activeEditor={editor} onClose={onClose} />
    //     )),
    // }),
    new ComponentPickerOption("Numbered List", {
      icon: <ListNumbersIcon />,
      keywords: ["numbered list", "ordered list", "ol"],
      onSelect: () =>
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption("Bulleted List", {
      icon: <ListUnorderedIcon />,
      keywords: ["bulleted list", "unordered list", "ul"],
      onSelect: () =>
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption("Check List", {
      icon: <CheckListIcon />,
      keywords: ["check list", "todo list"],
      onSelect: () =>
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption("Quote", {
      icon: <QuoteIcon />,
      keywords: ["block quote"],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        }),
    }),
    new ComponentPickerOption("Code", {
      icon: <CodeIcon />,
      keywords: ["javascript", "python", "js", "codeblock"],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            if (selection.isCollapsed()) {
              $setBlocksType(selection, () => $createCodeNode());
            } else {
              // Will this ever happen?
              const textContent = selection.getTextContent();
              const codeNode = $createCodeNode();
              selection.insertNodes([codeNode]);
              selection.insertRawText(textContent);
            }
          }
        }),
    }),
    new ComponentPickerOption("Divider", {
      icon: <DividerIcon />,
      keywords: ["horizontal rule", "divider", "hr"],
      onSelect: () =>
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
    }),
    new ComponentPickerOption("Toggle Draft", {
      icon: <DraftIcon />,
      keywords: ["draft", "private", "toggle", "visibility"],
      onSelect: () => editor.dispatchCommand(TOGGLE_DRAFT_COMMAND, undefined),
    }),
    new ComponentPickerOption("Image", {
      icon: <ImageIcon />,
      keywords: ["image", "photo", "picture", "file", "img"],
      onSelect: () => {
        console.log("[ComponentPicker] Image option selected");
        const url = prompt("Enter image URL:");
        console.log("[ComponentPicker] URL entered:", url);
        if (url) {
          console.log("[ComponentPicker] Dispatching INSERT_IMAGE_COMMAND");
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src: url,
            altText: "Image",
          });
        }
      },
    }),
    // new ComponentPickerOption("Page Break", {
    //   icon: <i className="icon page-break" />,
    //   keywords: ["page break", "divider"],
    //   onSelect: () => editor.dispatchCommand(INSERT_PAGE_BREAK, undefined),
    // }),
    // new ComponentPickerOption("Excalidraw", {
    //   icon: <i className="icon diagram-2" />,
    //   keywords: ["excalidraw", "diagram", "drawing"],
    //   onSelect: () =>
    //     editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, undefined),
    // }),
    // new ComponentPickerOption("Poll", {
    //   icon: <i className="icon poll" />,
    //   keywords: ["poll", "vote"],
    //   onSelect: () =>
    //     showModal("Insert Poll", (onClose) => (
    //       <InsertPollDialog activeEditor={editor} onClose={onClose} />
    //     )),
    // }),
    // ...EmbedConfigs.map(
    //   (embedConfig) =>
    //     new ComponentPickerOption(`Embed ${embedConfig.contentName}`, {
    //       icon: embedConfig.icon,
    //       keywords: [...embedConfig.keywords, "embed"],
    //       onSelect: () =>
    //         editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
    //     })
    // ),
    // new ComponentPickerOption("Equation", {
    //   icon: <i className="icon equation" />,
    //   keywords: ["equation", "latex", "math"],
    //   onSelect: () =>
    //     showModal("Insert Equation", (onClose) => (
    //       <InsertEquationDialog activeEditor={editor} onClose={onClose} />
    //     )),
    // }),
    // new ComponentPickerOption("GIF", {
    //   icon: <i className="icon gif" />,
    //   keywords: ["gif", "animate", "image", "file"],
    //   onSelect: () =>
    //     editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
    //       altText: "Cat typing on a laptop",
    //       src: catTypingGif,
    //     }),
    // }),
    // new ComponentPickerOption("Image", {
    //   icon: <i className="icon image" />,
    //   keywords: ["image", "photo", "picture", "file"],
    //   onSelect: () =>
    //     showModal("Insert Image", (onClose) => (
    //       <InsertImageDialog activeEditor={editor} onClose={onClose} />
    //     )),
    // }),
    // new ComponentPickerOption("Collapsible", {
    //   icon: <i className="icon caret-right" />,
    //   keywords: ["collapse", "collapsible", "toggle"],
    //   onSelect: () =>
    //     editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
    // }),
    // new ComponentPickerOption("Columns Layout", {
    //   icon: <i className="icon columns" />,
    //   keywords: ["columns", "layout", "grid"],
    //   onSelect: () =>
    //     showModal("Insert Columns Layout", (onClose) => (
    //       <InsertLayoutDialog activeEditor={editor} onClose={onClose} />
    //     )),
    // }),
    ...(["left", "center", "right", "justify"] as const).map(
      (alignment) =>
        new ComponentPickerOption(`Align ${alignment}`, {
          icon:
            alignment === "left" ? (
              <AlignLeftIcon />
            ) : alignment === "center" ? (
              <AlignCenterIcon />
            ) : alignment === "right" ? (
              <AlignRightIcon />
            ) : (
              <AlignJustifyIcon />
            ),
          keywords: ["align", "justify", alignment],
          onSelect: () =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment),
        })
    ),
  ];
}

export default function ComponentPickerMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  // const [modal, showModal] = useModal();
  const showModal = false;
  const [queryString, setQueryString] = useState<string | null>(null);

  useEffect(() => {
    console.log("[ComponentPicker] Plugin mounted");
  }, []);

  const baseCheckForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });
  
  const checkForTriggerMatch = useCallback(
    (text: string, editorArg: LexicalEditor) => {
      console.log("[ComponentPicker] checkForTriggerMatch called with text:", JSON.stringify(text));
      const result = baseCheckForTriggerMatch(text, editorArg);
      console.log("[ComponentPicker] Trigger result:", result);
      return result;
    },
    [baseCheckForTriggerMatch]
  );

  const options = useMemo(() => {
    const baseOptions = getBaseOptions(editor, showModal);

    if (!queryString) {
      return baseOptions;
    }

    const regex = new RegExp(queryString, "i");

    return [
      ...getDynamicOptions(editor, queryString),
      ...baseOptions.filter(
        (option) =>
          regex.test(option.title) ||
          option.keywords.some((keyword) => regex.test(keyword))
      ),
    ];
  }, [editor, queryString, showModal]);

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor]
  );

  return (
    <>
      {/* {modal} */}
      <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
        ) =>
          anchorElementRef.current && options.length
            ? ReactDOM.createPortal(
                <div className="relative bg-zed-bg min-w-[250px] py-1.5 px-[6px] shadow-lg border border-zed-border rounded-md z-50">
                  <ul>
                    {options.map((option, i: number) => (
                      <ComponentPickerMenuItem
                        index={i}
                        isSelected={selectedIndex === i}
                        onClick={() => {
                          setHighlightedIndex(i);
                          selectOptionAndCleanUp(option);
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(i);
                        }}
                        key={option.key}
                        option={option}
                      />
                    ))}
                  </ul>
                </div>,
                anchorElementRef.current
              )
            : null
        }
      />
    </>
  );
}
