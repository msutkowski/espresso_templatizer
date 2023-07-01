import type { HTMLElement, Node } from "node-html-parser";
import { NodeType } from "node-html-parser";

type GleamableElement = {
  type: "element" | "text";
  tag_name: string;
  attributes: { name: string; value: unknown }[];
  children: Array<GleamableElement | GleamableText>;
};

type GleamableText = {
  type: "text";
  content: string;
};

type GleamableNode = GleamableElement | GleamableText | null;

export const isHTMLElement = (node: Node): node is HTMLElement =>
  node.nodeType === NodeType.ELEMENT_NODE;

export const isTextNode = (node: Node): node is HTMLElement =>
  node.nodeType === NodeType.TEXT_NODE;

export const isGleamableElement = (
  node: GleamableNode
): node is GleamableElement => node?.type === "element";

export const isGleamableText = (node: GleamableNode): node is GleamableText =>
  node?.type === "text";

export function traverseDOM(node: HTMLElement | Node): GleamableNode {
  if (isTextNode(node)) {
    return {
      type: "text",
      content: node.textContent.trim(),
    } as GleamableText;
  } else if (isHTMLElement(node)) {
    const element: GleamableNode = {
      type: "element",
      tag_name: node.tagName?.toLowerCase() || "div",
      attributes: getAttributes(node),
      children: [],
    };

    // Loop over child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];

      // Recursively call the function for child nodes
      const childElement = traverseDOM(childNode);

      // Add the child Element object to the children array
      if (childElement) {
        element.children.push(childElement);
      }
    }

    return element;
  } else {
    // Other node types (e.g., comment nodes, etc.)
    return null;
  }
}

function getAttributes(node: HTMLElement) {
  return Object.entries(node.attributes).map(([key, value]) => ({
    name: key,
    value,
  }));
}

export function toGleam(obj: GleamableNode) {
  if (isGleamableElement(obj)) {
    let code = `t("${obj.tag_name}")`;

    if (obj.attributes.length > 0) {
      for (const attr of obj.attributes) {
        code += ` |> a("${attr.name}", "${attr.value}")`;
      }
    }

    const children = obj.children.map((child) => toGleam(child));
    if (children.length > 0) {
      code += ` |> c([${children.filter((f) => f !== 'txt("")').join(", ")}])`;
    }

    return code;
  } else if (isGleamableText(obj)) {
    return `txt("${obj.content}")`;
  } else {
    return "";
  }
}
