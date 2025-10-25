const shortenerLink = ({ url, link }: { url: string; link: string }): string => {
  try {
    const shortenedURL = new URL(url);
    return `${link}${shortenedURL.pathname}`;
  } catch (_error) {
    return "";
  }
};

export default shortenerLink;
