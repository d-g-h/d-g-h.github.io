import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BatchQr from "@/components/BatchQr";

vi.mock("@/lib/utils/getQRCode", () => ({
  getQRCode: vi.fn(async ({ text }: { text: string }) => `<svg><text>${text}</text></svg>`),
}));

describe("BatchQr", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("labels the textarea by id and generates the pasted 66-line batch", async () => {
    const input = Array.from(
      { length: 66 },
      (_, index) => `TBA123456789${String(index + 1).padStart(3, "0")}`,
    ).join("\n");

    render(<BatchQr />);

    const textarea = screen.getByLabelText("TBA list");
    expect(textarea).toHaveAttribute("id", "batch-tba-input");

    fireEvent.change(textarea, { target: { value: input } });
    fireEvent.click(screen.getByLabelText("Generate QR batch"));

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /^Toggle TBA/ })).toHaveLength(66);
    });
  });

  it("restores saved input and progress", () => {
    localStorage.setItem(
      "batch-tba-qr-state",
      JSON.stringify({
        input: "TBA123456789001",
        items: [{ id: "saved", tba: "TBA123456789001", svg: "<svg />", completed: true }],
        filter: "completed",
        showTextarea: true,
      }),
    );

    render(<BatchQr />);

    expect(screen.getByLabelText("TBA list")).toHaveValue("TBA123456789001");
    expect(screen.getByRole("button", { name: "Toggle TBA123456789001" })).toBeInTheDocument();
  });
});
