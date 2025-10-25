import { render, screen } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";

import { svgStringToElement } from "@/lib/utils/svg";

describe("svgStringToElement", () => {
  it("returns null for empty string", () => {
    const el = svgStringToElement("");
    expect(el).toBeNull();
  });

  it("parses svg string into React element with mapped attributes and children", () => {
    const svg = `<svg class="icon" viewBox="0 0 10 10"><text>Hi</text></svg>`;
    const el = svgStringToElement(svg);
    // render the element and assert
    render(el as React.ReactElement);
    const text = screen.getByText("Hi");
    expect(text).toBeInTheDocument();
  });
});
