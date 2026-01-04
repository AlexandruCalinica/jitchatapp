import { TextNode, ParagraphNode, LineBreakNode } from "lexical";
import { CodeNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { QuoteNode, HeadingNode } from "@lexical/rich-text";

import { MentionNode } from "./MentionNode";
import { HashtagNode } from "./HashtagNode";
import { VariableNode } from "./VariableNode";
import { ExtendedTextNode, $createExtendedTextNode } from "./ExtendedTextNode";
import {
  $createExtendedParagraphNode,
  ExtendedParagraphNode,
} from "./ExtendedParagraphNode";
import {
  $createExtendedLineBreakNode,
  ExtendedLineBreakNode,
} from "./ExtendedLineBreakNode";
import {
  $createExtendedQuoteNode,
  ExtendedQuoteNode,
} from "./ExtendedQuoteNode";
import {
  $createExtendedListNode,
  ExtendedListNode,
} from "./ExtendedListNode";
import {
  $createExtendedListItemNode,
  ExtendedListItemNode,
} from "./ExtendedListItemNode";
import { ExtendedImageNode } from "./ExtendedImageNode";
import { User } from "../shared/types";
import { configState } from "../shared/state";

export const createNodes = (user?: User) => [
  LinkNode,
  AutoLinkNode,
  HashtagNode,
  VariableNode,
  MentionNode,
  LineBreakNode,
  ExtendedParagraphNode,
  ExtendedTextNode,
  ExtendedLineBreakNode,
  ExtendedQuoteNode,
  ExtendedListNode,
  ExtendedListItemNode,
  ExtendedImageNode,
  HeadingNode,
  CodeNode,
  {
    replace: ParagraphNode,
    with: () => $createExtendedParagraphNode(user, configState.defaultDraft),
    withKlass: ExtendedParagraphNode,
  },
  {
    replace: TextNode,
    with: (node: TextNode) => $createExtendedTextNode(node.__text, user),
    withKlass: ExtendedTextNode,
  },
  {
    replace: LineBreakNode,
    with: () => $createExtendedLineBreakNode(user),
    withKlass: ExtendedLineBreakNode,
  },
  {
    replace: QuoteNode,
    with: () => $createExtendedQuoteNode(user, configState.defaultDraft),
    withKlass: ExtendedQuoteNode,
  },
  {
    replace: ListNode,
    with: (node: ListNode) => $createExtendedListNode(node.getListType(), user, configState.defaultDraft),
    withKlass: ExtendedListNode,
  },
  {
    replace: ListItemNode,
    with: () => $createExtendedListItemNode(user, configState.defaultDraft),
    withKlass: ExtendedListItemNode,
  },
];
