/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";

import Qr from "@/components/Qr";
import { getQRCode } from "../lib/utils/getQRCode";

jest.mock("../lib/utils/getQRCode", () => ({
  getQRCode: jest.fn(),
}));

describe("Qr component", () => {
  // Ensure crypto.randomUUID exists in older test environments.
  beforeAll(() => {
    if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: {
          randomUUID: () => "test-uuid-1",
        },
      });
    }
  });

  it("generates rows from textarea input and calls getQRCode", async () => {
    const mock = getQRCode as jest.MockedFunction<typeof getQRCode>;
    mock.mockResolvedValueOnce("<svg>QR</svg>");

    render(<Qr />);

    const textarea = screen.getByPlaceholderText(/XL19 83/);
    fireEvent.change(textarea, { target: { value: "XL19 83" } });

    // The UI has two buttons at the top: toggle and generate. Click the second one (generate)
    const buttons = screen.getAllByRole("button");
    const generateButton = buttons[1];
    fireEvent.click(generateButton);

    // Expect the label and value to appear after async generation
    const label = await screen.findByText("XL19");
    const value = await screen.findByText("83");

    expect(label).toBeInTheDocument();
    expect(value).toBeInTheDocument();

    // verify getQRCode called with the value string
    expect(mock).toHaveBeenCalledWith({ text: "83" });
  });

  it("cycles display state when clicking a generated row", async () => {
    const mock = getQRCode as jest.MockedFunction<typeof getQRCode>;
    mock.mockResolvedValueOnce("<svg>QR</svg>");

    render(<Qr />);

    const textarea = screen.getByPlaceholderText(/XL19 83/);
    fireEvent.change(textarea, { target: { value: "XL19 83" } });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    // wait for the mock to complete generation
    await waitFor(() => expect(mock).toHaveBeenCalled());
    const label = screen.getByText("XL19");

    // initial state is 'hide' so text opacity starts at 0.5
    expect(label).toBeInTheDocument();
    expect(label).toHaveStyle({ opacity: "0.5" });

    // click to cycle to 'qrOnly' (text opacity should be 0)
    fireEvent.click(label);
    expect(label).toHaveStyle({ opacity: "0" });

    // click to cycle to 'show' (text opacity should be 1)
    fireEvent.click(label);
    expect(label).toHaveStyle({ opacity: "1" });
  });

  it("moves an item to in-progress via drag/drop", async () => {
    const mock = getQRCode as jest.MockedFunction<typeof getQRCode>;
    mock.mockResolvedValueOnce("<svg>QR</svg>");

    render(<Qr />);

    const textarea = screen.getByPlaceholderText(/XL19 83/);
    fireEvent.change(textarea, { target: { value: "XL19 83" } });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    // ensure progress placeholder exists initially (emoji shown when empty)
    const placeholder = screen.getByText("🫳");
    expect(placeholder).toBeInTheDocument();

    // find the generated item and simulate drag/drop
    const draggable = await screen.findByText("XL19");

    type MockDataTransfer = {
      data: Record<string, string>;
      setData(key: string, value: string): void;
      getData(key: string): string | undefined;
    };

    const dataTransfer: MockDataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, value: string) {
        this.data[key] = value;
      },
      getData(key: string) {
        return this.data[key];
      },
    };

    fireEvent.dragStart(draggable, { dataTransfer });

    // target the first grid (in-progress) by using the placeholder's parent node
    const progressGrid = placeholder.parentElement as HTMLElement;
    fireEvent.dragOver(progressGrid, { dataTransfer });
    fireEvent.drop(progressGrid, { dataTransfer });

    // placeholder should be gone after drop
    expect(screen.queryByText("Drop items here")).not.toBeInTheDocument();
  });
});
