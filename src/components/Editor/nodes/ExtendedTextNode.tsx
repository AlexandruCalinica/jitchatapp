import { TextNode, $create, $setState, $getState } from "lexical";

import { User } from "../shared/types";
import { userState, draftState } from "../plugins/nodeStates";

export class ExtendedTextNode extends TextNode {
  $config() {
    return this.config("extended-text", {
      extends: TextNode,
    });
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);

    if (user) {
      dom.setAttribute("data-user", user.username);
    }
    if (isDraft) {
      dom.setAttribute("data-draft", "true");
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: any): boolean {
    const update = super.updateDOM(prevNode, dom, config);
    const user = $getState(this, userState);
    const isDraft = $getState(this, draftState);

    if (user) {
      dom.setAttribute("data-user", user.username);
    } else {
      dom.removeAttribute("data-user");
    }

    if (isDraft) {
      dom.setAttribute("data-draft", "true");
    } else {
      dom.removeAttribute("data-draft");
    }

    return update;
  }
}

export function $createExtendedTextNode(
  text: string,
  user?: User,
  isDraft?: boolean
): ExtendedTextNode {
  let node = $create(ExtendedTextNode);
  node.setTextContent(text);

  if (user) {
    node = $setState(node, userState, user);
  }

  if (isDraft !== undefined) {
    node = $setState(node, draftState, isDraft);
  }

  return node;
}

export function $isExtendedTextNode(node: any): node is ExtendedTextNode {
  return node instanceof ExtendedTextNode;
}
