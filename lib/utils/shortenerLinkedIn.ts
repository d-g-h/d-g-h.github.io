export default function shortenerLinkedIn({ url }: { url: string }): string {
  const LINKEDIN_URL = "linkedin.com";
  try {
    const shortenedURL = new URL(url);
    return `${LINKEDIN_URL}${shortenedURL.pathname}`;
  } catch (error) {
    console.error(error);
    return "";
  }
}
