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

    expect(screen.getByText(env.VITE_PHONE).closest("a")).toHaveAttribute(
      "href",
      `tel:+1${env.VITE_PHONE}`,
    );
  });

  it("renders the supplied QR code as a labeled image", () => {
    const qr = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    render(<Header qr={qr} />);
    expect(screen.getByRole("img", { name: "QR code for the public resume" })).toHaveAttribute(
      "src",
      `data:image/svg+xml,${encodeURIComponent(qr)}`,
    );
  });
});
