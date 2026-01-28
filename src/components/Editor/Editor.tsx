import type { EditorThemeClasses, NodeKey } from "lexical";

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useContext,
  useCallback,
  useImperativeHandle,
} from "react";

import * as Y from "yjs";
import { UndoManager } from "yjs";
import { twMerge } from "tailwind-merge";
import { TRANSFORMERS, UNORDERED_LIST } from "@lexical/markdown";
import { DASH_LIST, STAR_LIST } from "./plugins/DashListTransformer";
import { cva, VariantProps } from "class-variance-authority";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { PhoenixChannelProvider } from "./utils/y-phoenix-channel";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { $insertNodes, $nodesOfType, LexicalEditor } from "lexical";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
  LexicalComposer,
  InitialConfigType,
} from "@lexical/react/LexicalComposer";

import ToolbarPlugin from "./plugins/ToolbarPlugin";
import TextNodeTransformer from "./nodes/TextTransformar";
import { PhoenixSocketContext } from "../../contexts/phoenix-socket";

import { cn } from "../../util/cn.ts";
import { createNodes } from "./nodes/nodes";
import { HashtagNode } from "./nodes/HashtagNode";
import MentionsPlugin from "./plugins/MentionsPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import HashtagsPlugin from "./plugins/HashtagsPlugin";
import VariablePlugin from "./plugins/VariablesPlugin";
import { YjsUndoPlugin } from "./plugins/YjsUndoPlugin";
import ComponentPickerPlugin from "./plugins/ComponentPicker";
import FloatingLinkEditorPlugin from "./plugins/FloatingLinkEditorPlugin";
import { FloatingMenuPlugin } from "./plugins/FloatingTextFormatToolbarPlugin";
import { LinkPastePlugin } from "./plugins/PastePlugin.tsx";
import ImagesPlugin from "./plugins/ImagesPlugin";
import DragDropPastePlugin from "./plugins/DragDropPastePlugin";
import { UserPermissionPlugin } from "./plugins/UserPermissionPlugin";
import { TextBlurPlugin } from "./plugins/TextBlurPlugin";
import { DraftTogglePlugin } from "./plugins/DraftTogglePlugin";
import { ParagraphDraftPlugin } from "./plugins/ParagraphDraftPlugin";
import { EmptyParagraphPreventionPlugin } from "./plugins/EmptyParagraphPreventionPlugin";
import { CommitPlugin } from "./plugins/CommitPlugin";
import { NodeTransformPlugin } from "./plugins/NodeTransformPlugin";
import { syncCursorPositions } from "./plugins/Collaboration/SyncCursors";
import { User } from "./shared/types";
import { useConfigState } from "./shared/state";
import { FollowChannelProvider } from "./contexts/FollowChannelContext";
import { PingToFollowPlugin } from "./plugins/PingToFollowPlugin";
import { FollowNotificationPlugin } from "./plugins/FollowNotificationPlugin";
import { FollowModePlugin } from "./plugins/FollowModePlugin";
import { ScrollBroadcastPlugin } from "./plugins/ScrollBroadcastPlugin";

const theme: EditorThemeClasses = {
  paragraph: "pl-4 pb-1 mb-1",
  heading: {
    h1: "text-lg font-bold mb-4 pl-4",
    h2: "text-md font-bold mb-4 pl-4",
    h3: "text-sm font-bold mb-4 pl-4",
    h4: "text-sm font-bold mb-4 pl-4",
    h5: "text-sm font-bold mb-4 pl-4",
  },
  list: {
    ulDepth: [
      "p-0 m-0 list-outside list-disc",
      "p-0 m-0 list-outside list-(--list-style-type-circle)",
      "p-0 m-0 list-outside list-(--list-style-type-square)",
      "p-0 m-0 list-outside list-(--list-style-type-dash)",
      "p-0 m-0 list-outside list-disc",
    ],
    nested: {
      listitem: "editor__nestedListItem",
    },
    ol: "p-0 m-0 list-outside list-decimal mb-2 pl-2",
    ul: "p-0 m-0 list-outside mb-2 pl-2",
    listitem: "",
    olDepth: [
      "p-0 m-0 list-outside",
      "p-0 m-0 list-outside list-[upper-alpha]",
      "p-0 m-0 list-outside list-[lower-alpha]",
      "p-0 m-0 list-outside list-[upper-roman]",
      "p-0 m-0 list-outside list-[lower-roman]",
    ],
    listitemChecked: "list-none editor__listItemChecked",
    listitemUnchecked: "list-none editor__listItemUnchecked",
  },
  link: "text-zed-blue hover:text-zed-blue/80",
  text: {
    bold: "editor-textBold",
    code: "editor-textCode",
    italic: "editor-textItalic",
    strikethrough: "editor-textStrikethrough",
    subscript: "editor-textSubscript",
    superscript: "editor-textSuperscript",
    underline: "editor-textUnderline",
    underlineStrikethrough: "editor-textUnderlineStrikethrough",
  },
  quote:
    "border-l-[2px] border-zed-muted ml-2 pl-2 my-3",
};

const onError = (error: Error) => {
  console.error(error);
};

const contentEditableVariants = cva("focus:outline-none", {
  variants: {
    size: {
      xs: ["text-sm"],
      sm: ["text-sm"],
      md: ["text-base"],
      lg: ["text-lg"],
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type SelectOption = {
  label: string;
  value: string;
};

interface EditorProps extends VariantProps<typeof contentEditableVariants> {
  useYjs?: boolean;
  namespace: string;
  dataTest?: string;
  className?: string;
  documentId?: string;
  placeholder?: string;
  isReadOnly?: boolean;
  usePlainText?: boolean;
  defaultHtmlValue?: string;
  mentionsOptions?: string[];
  variableOptions?: string[];
  children?: React.ReactNode;
  showToolbarBottom?: boolean;
  placeholderClassName?: string;
  hashtagsOptions?: SelectOption[];
  onChange?: (html: string) => void;
  onHashtagCreate?: (hashtag: string) => void;
  onHashtagSearch?: (q: string | null) => void;
  onMentionsSearch?: (q: string | null) => void;
  onHashtagsChange?: (hashtags: SelectOption[]) => void;
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
  user?: User;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onUndoStateChange?: (canUndo: boolean, canRedo: boolean) => void;
  undoRef?: React.MutableRefObject<{
    undo: () => void;
    redo: () => void;
  } | null>;
  textBlur?: {
    unlockKey?: string;
    blurAmount?: string;
    showIndicator?: boolean;
  };
  draftMode?: "always" | "default";
  preventEmptyParagraphs?: boolean;
}

export const Editor = forwardRef<LexicalEditor | null, EditorProps>(
  (
    {
      size,
      onBlur,
      dataTest,
      onFocus,
      children,
      onChange,
      className,
      namespace,
      draftMode = "default",
      onHashtagSearch,
      onHashtagCreate,
      onHashtagsChange,
      onMentionsSearch,
      defaultHtmlValue,
      hashtagsOptions = [],
      mentionsOptions = [],
      variableOptions = [],
      usePlainText = false,
      placeholderClassName,
      onKeyDown: _onKeyDown,
      useYjs = false,
      user,
      placeholder = "Type something",
      showToolbarBottom = false,
      isReadOnly = false,
      onUndoStateChange,
      undoRef,
      documentId,
      textBlur,
      preventEmptyParagraphs = true,
    },
    ref
  ) => {
    const editor = useRef<LexicalEditor | null>(null);
    const hasLoadedDefaultHtmlValue = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [floatingAnchorElem, setFloatingAnchorElem] =
      useState<HTMLDivElement>();
    const [_yjsProvider, setYjsProvider] =
      useState<PhoenixChannelProvider | null>(null);
    const [undoManager, setUndoManager] = useState<UndoManager | null>(null);
    const [_connectionStatus, setConnectionStatus] = useState<
      "disconnected" | "connecting" | "connected"
    >("disconnected");
    const [_, setConfigState] = useConfigState();

    const { socket } = useContext(PhoenixSocketContext);

    const initialConfig: InitialConfigType = {
      namespace,
      theme,
      onError,
      nodes: createNodes(user),
      editorState: useYjs ? null : undefined,
      editable: !isReadOnly,
    };

    const EditorPlugin = usePlainText ? PlainTextPlugin : RichTextPlugin;

    const onRef = (_floatingAnchorElem: HTMLDivElement) => {
      if (_floatingAnchorElem !== null) {
        setFloatingAnchorElem(_floatingAnchorElem);
      }
    };

    useImperativeHandle(ref, () => editor.current as LexicalEditor);

    useEffect(() => {
      if (useYjs) return;

      editor.current?.update(() => {
        if (!editor?.current || hasLoadedDefaultHtmlValue.current) return;

        if (defaultHtmlValue) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(defaultHtmlValue, "text/html");
          const nodes = $generateNodesFromDOM(editor?.current, dom);

          $insertNodes(nodes);
          hasLoadedDefaultHtmlValue.current = true;
        }
      });

      const dispose = editor?.current?.registerUpdateListener(
        ({ editorState }) => {
          editorState.read(() => {
            if (!editor?.current) return;

            const hashtagNodes = $nodesOfType(HashtagNode);
            const html = $generateHtmlFromNodes(editor?.current);

            onChange?.(html);
            onHashtagsChange?.(hashtagNodes.map((node) => node.__hashtag));
          });
        }
      );

      return () => {
        dispose?.();
      };
    }, [useYjs]);

    const providerFactory = useCallback(
      (id: string, yjsDocMap: Map<string, Y.Doc>) => {
        if (!useYjs || !socket) {
          return null;
        }

        const doc = (() => {
          if (yjsDocMap.has(id)) {
            const doc = yjsDocMap.get(id)!;

            doc.load();

            return doc;
          }

          const doc = new Y.Doc();

          yjsDocMap.set(id, doc);

          return doc;
        })();

        const provider = new PhoenixChannelProvider(
          socket!,
          `documents:${id}`,
          doc,
          {
            disableBc: true,
          }
        );

        provider.on("status", (e) => {
          setConnectionStatus(e.status);
        });

        const yXmlFragment = doc.get("lexical", Y.XmlFragment);
        const newUndoManager = new UndoManager(yXmlFragment, {
          captureTimeout: 500,
          trackedOrigins: new Set([null, provider]),
        });

        setTimeout(() => setUndoManager(newUndoManager), 0);
        setTimeout(() => setYjsProvider(provider), 0);

        return provider;
      },
      [socket, useYjs]
    );

    useEffect(() => {
      if (undoRef && undoManager) {
        undoRef.current = {
          undo: () => undoManager.undo(),
          redo: () => undoManager.redo(),
        };
      }

      return () => {
        if (undoRef) {
          undoRef.current = null;
        }
      };
    }, [undoManager, undoRef]);

    useEffect(() => {
      if (user) {
        setConfigState({
          currentUser: user,
        });
      }
    }, [user]);

    useEffect(() => {
      if (documentId) {
        setConfigState({
          channelId: `documents:${documentId}`,
        });
      }
    }, [documentId]);

    if (!socket) {
      return <div>No socket</div>;
    }

    return (
      <FollowChannelProvider documentId={documentId ?? null}>
        <div
          ref={containerRef}
          className="relative w-full h-fit lexical-editor cursor-text animate-fadeIn"
        >
          <LexicalComposer initialConfig={initialConfig}>
          <EditorRefPlugin editorRef={editor} />
          <CheckListPlugin />
          <AutoLinkPlugin />
          {!useYjs && <HistoryPlugin />}
          <AutoFocusPlugin />
          <TextNodeTransformer />
          <ListPlugin />
          <ImagesPlugin />
          <DragDropPastePlugin />

          <MarkdownShortcutPlugin transformers={[DASH_LIST, STAR_LIST, ...TRANSFORMERS.filter(t => t !== UNORDERED_LIST)]} />

          {onMentionsSearch && (
            <MentionsPlugin
              options={mentionsOptions}
              onSearch={onMentionsSearch}
            />
          )}
          <TabIndentationPlugin />

          <LinkPastePlugin />

          {variableOptions?.length > 0 && (
            <VariablePlugin options={variableOptions} />
          )}

          {onHashtagSearch && (
            <HashtagsPlugin
              options={hashtagsOptions}
              onCreate={onHashtagCreate}
              onSearch={onHashtagSearch}
            />
          )}

          <UserPermissionPlugin currentUser={user} />
          <TextBlurPlugin
            currentUser={user}
            unlockKey={textBlur?.unlockKey || "Alt"}
          />
          <DraftTogglePlugin
            draftMode={draftMode}
            currentUser={user?.username}
          />
          <ParagraphDraftPlugin
            currentUser={user}
            unlockKey={textBlur?.unlockKey || "Alt"}
            showIndicator={textBlur?.showIndicator !== false}
          />
          <EmptyParagraphPreventionPlugin
            currentUser={user}
            enabled={preventEmptyParagraphs}
          />
          <CommitPlugin currentUser={user} />
          <NodeTransformPlugin currentUser={user} />

          {useYjs && <PingToFollowPlugin />}
          {useYjs && <FollowNotificationPlugin />}
          {useYjs && <FollowModePlugin containerRef={containerRef} />}
          {useYjs && <ScrollBroadcastPlugin containerRef={containerRef} />}

          {floatingAnchorElem && !usePlainText && (
            <>
              <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
              <FloatingMenuPlugin
                element={floatingAnchorElem}
                variableOptions={variableOptions}
              />
            </>
          )}
          <EditorPlugin
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={
              <p
                onClick={() => editor.current?.focus()}
                className={twMerge(
                  contentEditableVariants({
                    size,
                    className: placeholderClassName,
                  }),
                  "editor__placeholder"
                )}
              >
                {placeholder}
              </p>
            }
            contentEditable={
              <div
                ref={onRef}
                className={cn("relative animate-fadeIn", className)}
              >
                <ContentEditable
                  onBlur={onBlur}
                  onFocus={onFocus}
                  autoFocus={false}
                  spellCheck="false"
                  data-test={dataTest}
                  // onKeyDown={(e) =>
                  //   onKeyDown ? onKeyDown(e) : e.stopPropagation()
                  // }
                  className={twMerge(
                    contentEditableVariants({ size, className })
                  )}
                />
              </div>
            }
          />

          <ComponentPickerPlugin />

          {documentId && (
            <CollaborationPlugin
              id={documentId}
              shouldBootstrap={false}
              username={user?.username}
              cursorColor={user?.color}
              cursorsContainerRef={containerRef}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              providerFactory={providerFactory as any}
              syncCursorPositionsFn={syncCursorPositions}
            />
          )}

          {useYjs && (
            <YjsUndoPlugin
              undoManager={undoManager}
              onUndoStateChange={onUndoStateChange}
            />
          )}
          <div
            className={cn(
              "w-full flex justify-between items-center mt-2",
              !showToolbarBottom && "justify-end"
            )}
          >
            {showToolbarBottom && <ToolbarPlugin />}
            {children}
          </div>
        </LexicalComposer>
        </div>
      </FollowChannelProvider>
    );
  }
);

export default Editor;

export type Cursor = {
  color: string;
  name: string;
  selection: null | CursorSelection;
};

export type CursorSelection = {
  anchor: {
    key: NodeKey;
    offset: number;
  };
  caret: HTMLElement;
  color: string;
  focus: {
    key: NodeKey;
    offset: number;
  };
  name: HTMLSpanElement;
  selections: Array<HTMLElement>;
};

export function createCursorSelection(
  cursor: Cursor,
  anchorKey: NodeKey,
  anchorOffset: number,
  focusKey: NodeKey,
  focusOffset: number
): CursorSelection {
  const color = cursor.color;
  const caret = document.createElement("span");
  caret.style.cssText = `position:absolute;top:0;bottom:0;right:-1px;width:1px;background-color:${color};z-index:10;`;
  const name = document.createElement("span");
  name.textContent = cursor.name;
  name.style.cssText = `position:absolute;left:-2px;top:-16px;background-color:${color};color:#fff;line-height:12px;font-size:12px;padding:2px;font-family:Arial;font-weight:bold;white-space:nowrap;`;
  caret.appendChild(name);
  return {
    anchor: {
      key: anchorKey,
      offset: anchorOffset,
    },
    caret,
    color,
    focus: {
      key: focusKey,
      offset: focusOffset,
    },
    name,
    selections: [],
  };
}
