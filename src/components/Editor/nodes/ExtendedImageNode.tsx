import {
  DecoratorNode,
  $create,
  $setState,
  $getState,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
  LexicalNode,
  DOMExportOutput,
  DOMConversionMap,
  DOMConversionOutput,
} from "lexical";
import { Suspense, lazy } from "react";

import { User } from "../shared/types";
import { userState, draftState, timestampState } from "../plugins/nodeStates";
import { getAvatarUrl } from "../../../utils/avatar";

const ImageComponent = lazy(() => import("./ImageComponent"));

export interface ImagePayload {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  key?: NodeKey;
  user?: User;
  isDraft?: boolean;
  timestamp?: number;
}

export type SerializedExtendedImageNode = Spread<
  {
    src: string;
    altText: string;
    width: number;
    height: number;
    maxWidth: number;
  },
  SerializedLexicalNode
>;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isToday) return timeStr;
  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `${dateStr}, ${timeStr}`;
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith("file:///")) {
    return null;
  }
  const node = $createExtendedImageNode({
    src: img.src,
    altText: img.alt || "",
    width: img.width || undefined,
    height: img.height || undefined,
  });
  return { node };
}

export class ExtendedImageNode extends DecoratorNode<JSX.Element> {
  __src: string = "";
  __altText: string = "";
  __width: "inherit" | number = "inherit";
  __height: "inherit" | number = "inherit";
  __maxWidth: number = 400;

  $config() {
    return this.config("extended-image", {});
  }

  static getType(): string {
    return "extended-image";
  }

  static clone(node: ExtendedImageNode): ExtendedImageNode {
    const clone = $create(ExtendedImageNode);
    clone.__src = node.__src;
    clone.__altText = node.__altText;
    clone.__width = node.__width;
    clone.__height = node.__height;
    clone.__maxWidth = node.__maxWidth;
    clone.__key = node.__key;
    return clone;
  }

  static importJSON(serializedNode: SerializedExtendedImageNode): ExtendedImageNode {
    const { src, altText, width, height, maxWidth } = serializedNode;
    return $createExtendedImageNode({
      src,
      altText,
      width: width || undefined,
      height: height || undefined,
      maxWidth,
    });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  setSrc(src: string): this {
    const self = this.getWritable();
    self.__src = src;
    return self;
  }

  setAltText(altText: string): this {
    const self = this.getWritable();
    self.__altText = altText;
    return self;
  }

  setDimensions(width: "inherit" | number, height: "inherit" | number): this {
    const self = this.getWritable();
    self.__width = width;
    self.__height = height;
    return self;
  }

  setMaxWidth(maxWidth: number): this {
    const self = this.getWritable();
    self.__maxWidth = maxWidth;
    return self;
  }

  exportJSON(): SerializedExtendedImageNode {
    return {
      type: "extended-image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width === "inherit" ? 0 : this.__width,
      height: this.__height === "inherit" ? 0 : this.__height,
      maxWidth: this.__maxWidth,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    if (this.__width !== "inherit") {
      element.setAttribute("width", this.__width.toString());
    }
    if (this.__height !== "inherit") {
      element.setAttribute("height", this.__height.toString());
    }
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }

    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);

    if (user) {
      span.setAttribute("data-user", user.username);
      span.style.setProperty("--user-color", user.color);
      const avatarUrl = getAvatarUrl(user, "small");
      span.style.setProperty("--avatar-url", `url(${avatarUrl})`);
    }
    if (isDraft) {
      span.setAttribute("data-draft", "true");
    }
    if (timestamp !== undefined) {
      span.setAttribute("data-timestamp", timestamp.toString());
      span.setAttribute("data-time", formatTime(timestamp));
    }

    return span;
  }

  updateDOM(_prevNode: ExtendedImageNode, dom: HTMLElement): boolean {
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);

    if (user) {
      dom.setAttribute("data-user", user.username);
      dom.style.setProperty("--user-color", user.color);
      const avatarUrl = getAvatarUrl(user, "small");
      dom.style.setProperty("--avatar-url", `url(${avatarUrl})`);
    } else {
      dom.removeAttribute("data-user");
      dom.style.removeProperty("--user-color");
      dom.style.removeProperty("--avatar-url");
    }

    if (isDraft) {
      dom.setAttribute("data-draft", "true");
    } else {
      dom.removeAttribute("data-draft");
    }

    if (timestamp !== undefined) {
      dom.setAttribute("data-timestamp", timestamp.toString());
      dom.setAttribute("data-time", formatTime(timestamp));
    } else {
      dom.removeAttribute("data-timestamp");
      dom.removeAttribute("data-time");
    }

    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): JSX.Element {
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);
    const timestamp = $getState(this, timestampState);

    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          user={user}
          isDraft={isDraft}
          timestamp={timestamp}
        />
      </Suspense>
    );
  }

  isInline(): boolean {
    return true;
  }
}

export function $createExtendedImageNode(payload: ImagePayload): ExtendedImageNode {
  let node = $create(ExtendedImageNode);
  node = node.setSrc(payload.src);
  node = node.setAltText(payload.altText);
  
  if (payload.width !== undefined || payload.height !== undefined) {
    node = node.setDimensions(
      payload.width ?? "inherit",
      payload.height ?? "inherit"
    );
  }
  
  if (payload.maxWidth !== undefined) {
    node = node.setMaxWidth(payload.maxWidth);
  }

  if (payload.user !== undefined) {
    node = $setState(node, userState, payload.user);
  }
  if (payload.isDraft !== undefined) {
    node = $setState(node, draftState, payload.isDraft);
  }
  if (payload.timestamp !== undefined) {
    node = $setState(node, timestampState, payload.timestamp);
  }

  return node;
}

export function $isExtendedImageNode(
  node: LexicalNode | null | undefined
): node is ExtendedImageNode {
  return node instanceof ExtendedImageNode;
}
