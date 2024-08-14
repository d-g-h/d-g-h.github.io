/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Description from "@/components/description";

const DESCRIPTION = "Job description";

describe("Description", () => {
  it("renders Description", () => {
    render(<Description description={DESCRIPTION} />);

    const description = screen.getByText(DESCRIPTION);

    expect(description).toBeInTheDocument();
  });
  it("renders html correctly", () => {
    const { container } = render(<Description description={DESCRIPTION} />);
    expect(container).toMatchSnapshot();
  });
});
