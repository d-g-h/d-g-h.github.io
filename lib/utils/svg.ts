import React from "react";

const ATTRIBUTE_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  "shape-rendering": "shapeRendering",
  "clip-path": "clipPath",
  "fill-opacity": "fillOpacity",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-opacity": "strokeOpacity",
  "text-anchor": "textAnchor",
};

export const svgStringToElement = (svgString: string): React.ReactElement | null => {
  if (!svgString) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgNode = doc.documentElement;

    const convert = (node: Element): React.ReactElement => {
      const props: { [key: string]: string } = {};
      for (const attr of Array.from(node.attributes)) {
        const name = ATTRIBUTE_MAP[attr.name] || attr.name;
        props[name] = attr.value;
      }
      const children = Array.from(node.childNodes)
        .map((child) => {
          if (child.nodeType === Node.TEXT_NODE) return child.textContent;
          if (child.nodeType === Node.ELEMENT_NODE) return convert(child as Element);
          return null;
        })
        .filter(Boolean);
      return React.createElement(node.tagName, props, ...children);
    };

    return convert(svgNode);
  } catch (_e) {
    return null;
  }
};
