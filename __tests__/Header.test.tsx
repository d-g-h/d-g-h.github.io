/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "@/components/Header";
import shortenerLink from "@/lib/utils/shortenerLink";

const env = {
  NEXT_PUBLIC_URL: "https://qr.qr/t",
  NEXT_PUBLIC_NAME: "Name Name",
  NEXT_PUBLIC_GITHUB: "https://github.com/profile",
  NEXT_PUBLIC_EMAIL: "email@email.email",
  NEXT_PUBLIC_LINKEDIN: "https://linkedin.com/in/profile",
  NEXT_PUBLIC_PHONE: "7188675309",
};

beforeAll(() => {
  Object.assign(process.env, env);
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Header", () => {
  it("renders Header component correctly", () => {
    const { container } = render(<Header />);
    expect(container).toMatchSnapshot();
    expect(screen.getByText(env.NEXT_PUBLIC_NAME)).toBeInTheDocument();
    expect(screen.getByText(env.NEXT_PUBLIC_NAME).closest("a")).toHaveAttribute(
      "href",
      env.NEXT_PUBLIC_GITHUB,
    );

    expect(screen.getByText(env.NEXT_PUBLIC_EMAIL)).toBeInTheDocument();
    expect(screen.getByText(env.NEXT_PUBLIC_EMAIL).closest("a")).toHaveAttribute(
      "href",
      `mailto:${env.NEXT_PUBLIC_EMAIL}`,
    );

    expect(
      screen.getByText(shortenerLink({ url: env.NEXT_PUBLIC_LINKEDIN, link: "linkedin.com" })),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText(shortenerLink({ url: env.NEXT_PUBLIC_LINKEDIN, link: "linkedin.com" }))
        .closest("a"),
    ).toHaveAttribute("href", env.NEXT_PUBLIC_LINKEDIN);

    expect(
      screen.getByText(shortenerLink({ url: env.NEXT_PUBLIC_GITHUB, link: "github.com" })),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText(shortenerLink({ url: env.NEXT_PUBLIC_GITHUB, link: "github.com" }))
        .closest("a"),
    ).toHaveAttribute("href", env.NEXT_PUBLIC_GITHUB);

    expect(screen.queryByText(env.NEXT_PUBLIC_PHONE)).not.toBeInTheDocument();
  });

  it("renders phone link when phone prop is true", () => {
    const { container } = render(<Header phone />);
    expect(container).toMatchSnapshot();
    expect(screen.getByText(env.NEXT_PUBLIC_PHONE)).toBeInTheDocument();
    expect(screen.getByText(env.NEXT_PUBLIC_PHONE).closest("a")).toHaveAttribute(
      "href",
      `tel:+1${env.NEXT_PUBLIC_PHONE}`,
    );
  });

  it("renders qr code when url is defined", async () => {
    const { container } = render(<Header text={env.NEXT_PUBLIC_URL} />);
    expect(container).toMatchSnapshot();
  });
});
