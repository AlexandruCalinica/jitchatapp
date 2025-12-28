import { $create, $getState, $setState, LineBreakNode } from "lexical";
import { userState } from "../plugins/nodeStates";
import { User } from "../shared/types";

export class ExtendedLineBreakNode extends LineBreakNode {
  $config() {
    return this.config("extended-linebreak", {
      extends: LineBreakNode,
    });
  }

  createDOM(): HTMLElement {
    const dom = super.createDOM();
    const user = $getState(this, userState);
    if (user) {
      dom.setAttribute("data-user", user.username);
    } else {
      dom.removeAttribute("data-user");
    }
    return dom;
  }

  updateDOM(): false {
    // LineBreakNode's updateDOM always returns false
    // We can't modify the DOM here, so we'll handle user attribute updates
    // in the createDOM method when the node is recreated
    return false;
  }
}

export function $createExtendedLineBreakNode(
  user?: User
): ExtendedLineBreakNode {
  return $setState($create(ExtendedLineBreakNode), userState, user);
}

export function $isExtendedLineBreakNode(
  node: any
): node is ExtendedLineBreakNode {
  return node instanceof ExtendedLineBreakNode;
}
