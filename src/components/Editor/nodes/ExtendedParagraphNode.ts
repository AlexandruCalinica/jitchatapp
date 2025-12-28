import { $create, $setState, ParagraphNode, $getState } from "lexical";

import { User } from "../shared/types";

import { userState } from "../plugins/nodeStates";

export class ExtendedParagraphNode extends ParagraphNode {
  $config() {
    return this.config("extended-paragraph", {
      extends: ParagraphNode,
    });
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    const user = $getState(this, userState);
    if (user) {
      dom.setAttribute("data-user", user.username);
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: any): boolean {
    const update = super.updateDOM(prevNode, dom, config);
    const user = $getState(this, userState);
    if (user) {
      dom.setAttribute("data-user", user.username);
    } else {
      dom.removeAttribute("data-user");
    }
    return update;
  }
}

export function $createExtendedParagraphNode(
  user?: User
): ExtendedParagraphNode {
  return $setState($create(ExtendedParagraphNode), userState, user);
}

export function $isExtendedParagraphNode(
  node: any
): node is ExtendedParagraphNode {
  return node instanceof ExtendedParagraphNode;
}
