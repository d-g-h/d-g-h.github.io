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
});
