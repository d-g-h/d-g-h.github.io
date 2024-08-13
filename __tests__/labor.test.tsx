/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Labor from "@/components/labor";

const KEY = "0";
const COMPANY = "Company";
const TITLE = "Job Title";
const LOCATION = "Location";
const START = "2020-02";
const END = "2024-02";

describe("Labor", () => {
  it("renders Labor", () => {
    render(
      <Labor
        key={KEY}
        title={TITLE}
        location={LOCATION}
        company={COMPANY}
        start={START}
        end={END}
      >
        <></>
      </Labor>,
    );

    const jobTitle = screen.getByText("Job Title");
    const location = screen.getByText("Location");

    expect(jobTitle).toBeInTheDocument();
    expect(location).toBeInTheDocument();
  });
  it("renders Labor without Company", () => {
    render(
      <Labor
        key={KEY}
        title={TITLE}
        location={LOCATION}
        start={START}
        end={END}
      >
        <></>
      </Labor>,
    );

    const jobTitle = screen.getByText("Job Title");
    const company = screen.queryByText("Company");

    expect(jobTitle).toBeInTheDocument();
    expect(company).toBeNull();
  });
  it("renders html correctly", () => {
    const { container } = render(
      <Labor
        key={KEY}
        title={TITLE}
        location={LOCATION}
        company={COMPANY}
        start={START}
        end={END}
      >
        <></>
      </Labor>,
    );
    expect(container).toMatchSnapshot();
  });
});
