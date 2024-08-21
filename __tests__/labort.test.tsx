/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LaborT from "@/components/labort";

const KEY = "0";
const COMPANY = "Company";
const TITLE = "Job Title";
const LOCATION = "Location";
const START = "2020-02";
const END = "2024-02";

describe("Labor", () => {
  it("renders Labor", () => {
    render(
      <LaborT
        key={KEY}
        title={TITLE}
        location={LOCATION}
        company={COMPANY}
        start={START}
        end={END}
      >
        <></>
      </LaborT>
    );

    const jobTitle = screen.getByText("Job Title");
    const location = screen.getByText("Location");

    expect(jobTitle).toBeInTheDocument();
    expect(location).toBeInTheDocument();
  });
  it("renders Labor without Company", () => {
    render(
      <LaborT
        key={KEY}
        title={TITLE}
        location={LOCATION}
        start={START}
        end={END}
      >
        <></>
      </LaborT>
    );

    const jobTitle = screen.getByText("Job Title");
    const company = screen.queryByText("Company");

    expect(jobTitle).toBeInTheDocument();
    expect(company).toBeNull();
  });
  it("renders html correctly", () => {
    const { container } = render(
      <LaborT
        key={KEY}
        title={TITLE}
        location={LOCATION}
        company={COMPANY}
        start={START}
        end={END}
      >
        <></>
      </LaborT>
    );
    expect(container).toMatchSnapshot();
  });
});
