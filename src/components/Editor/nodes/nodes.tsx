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
import { User } from "../shared/types";

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
  HeadingNode,
  CodeNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  {
    replace: ParagraphNode,
    with: () => $createExtendedParagraphNode(user),
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
];
