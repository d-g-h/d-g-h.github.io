export default function shortenerLink({
  url,
  link,
}: {
  url: string;
  link: string;
}): string {
  try {
    const shortenedURL = new URL(url);
    return `${link}${shortenedURL.pathname}`;
  } catch (error) {
    console.log(error);
    return "";
  }
}
