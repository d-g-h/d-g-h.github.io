/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Time from "@/components/Time";

const START = "2020-02";
const END = "2024-02";

describe("Time", () => {
  it("renders Time", () => {
    render(<Time start={START} end={END}></Time>);

    const start = screen.getByText("February 2020");
    const end = screen.getByText("February 2024");

    expect(start).toBeInTheDocument();
    expect(end).toBeInTheDocument();
  });
  it("renders Time without end date", () => {
    render(<Time start={START}></Time>);

    const present = screen.getByText("- present");

    expect(present).toBeInTheDocument();
  });
  it("renders html correctly", () => {
    const { container } = render(<Time start={START} end={END}></Time>);
    expect(container).toMatchSnapshot();
  });
});
