/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Time from "@/components/Time";

describe("Time", () => {
  it("renders start date to present", () => {
    render(<Time start={"2024-02"} />);

    const start = screen.getByText("February 2024");
    const end = screen.getByText("- present");

    expect(start).toBeInTheDocument();
    expect(end).toBeInTheDocument();
  });

  it("renders start date to end date", () => {
    render(<Time start={"2022-02"} end={"2022-12"} />);

    const start = screen.getByText("February 2022");
    const hypen = screen.getByText("-");
    const end = screen.getByText("December 2022");

    expect(start).toBeInTheDocument();
    expect(hypen).toBeInTheDocument();
    expect(end).toBeInTheDocument();
  });

  it("renders html correctly", () => {
    const { container } = render(<Time start={"2024-04"} />);
    expect(container).toMatchSnapshot();
  });
});
