import { render, screen } from "@testing-library/react";
import Summary from "@/components/Summary";

const SUMMARY = "Sum of the summary";

describe("Summary", () => {
  it("renders Summary", () => {
    render(<Summary summary={SUMMARY} />);

    const summary = screen.getByText(SUMMARY);

    expect(summary).toBeInTheDocument();
  });
  it("renders html correctly", () => {
    const { container } = render(<Summary summary={SUMMARY} />);
    expect(container).toMatchSnapshot();
  });
});
