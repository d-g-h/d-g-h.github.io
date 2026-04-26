import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";
import shortenerLink from "@/lib/utils/shortenerLink";

const env = {
  VITE_URL: "https://qr.qr/t",
  VITE_NAME: "Name Name",
  VITE_GITHUB: "https://github.com/profile",
  VITE_EMAIL: "email@email.email",
  VITE_LINKEDIN: "https://linkedin.com/in/profile",
  VITE_PHONE: "7188675309",
};

beforeAll(() => {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Header", () => {
  it("renders Header component correctly", () => {
    const { container } = render(<Header />);
    expect(container).toMatchSnapshot();
    expect(screen.getByText(env.VITE_NAME)).toBeInTheDocument();
    expect(screen.getByText(env.VITE_NAME).closest("a")).toHaveAttribute("href", env.VITE_GITHUB);

    expect(screen.getByText(env.VITE_EMAIL)).toBeInTheDocument();
    expect(screen.getByText(env.VITE_EMAIL).closest("a")).toHaveAttribute(
      "href",
      `mailto:${env.VITE_EMAIL}`,
    );

    expect(
      screen.getByText(shortenerLink({ url: env.VITE_LINKEDIN, link: "linkedin.com" })),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText(shortenerLink({ url: env.VITE_LINKEDIN, link: "linkedin.com" }))
        .closest("a"),
    ).toHaveAttribute("href", env.VITE_LINKEDIN);

    expect(
      screen.getByText(shortenerLink({ url: env.VITE_GITHUB, link: "github.com" })),
    ).toBeInTheDocument();
    expect(
      screen.getByText(shortenerLink({ url: env.VITE_GITHUB, link: "github.com" })).closest("a"),
    ).toHaveAttribute("href", env.VITE_GITHUB);

    expect(screen.queryByText(env.VITE_PHONE)).not.toBeInTheDocument();
  });

  it("renders text-only values when printPdf is true", () => {
    render(<Header phone printPdf />);
    expect(screen.getByText(env.VITE_NAME).closest("a")).toBeNull();
    expect(screen.getByText(env.VITE_EMAIL).closest("a")).toBeNull();
    expect(
      screen
        .getByText(shortenerLink({ url: env.VITE_LINKEDIN, link: "linkedin.com" }))
        .closest("a"),
    ).toBeNull();
    expect(
      screen.getByText(shortenerLink({ url: env.VITE_GITHUB, link: "github.com" })).closest("a"),
    ).toBeNull();
    expect(screen.getByText(env.VITE_PHONE).closest("a")).toBeNull();
  });

  it("renders phone link when phone prop is true", () => {
    const { container } = render(<Header phone />);
    expect(container).toMatchSnapshot();
    expect(screen.getByText(env.VITE_PHONE)).toBeInTheDocument();
    expect(screen.getByText(env.VITE_PHONE).closest("a")).toHaveAttribute(
      "href",
      `tel:+1${env.VITE_PHONE}`,
    );
  });

  it("renders qr code when url is defined", async () => {
    const { container } = render(<Header text={env.VITE_URL} />);
    expect(container).toMatchSnapshot();
  });
});
