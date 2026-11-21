import shortenerLink from "@/lib/utils/shortenerLink";

describe("formattedURL`", () => {
  test("should shorten LinkedIn URL", () => {
    const link = "linkedin.com";
    const formattedString = "https://www.linkedin.com/in/d-g-h";
    const expectedDateString = `${link}/in/d-g-h`;

    const result = shortenerLink({ url: formattedString, link: link });

    expect(result).toEqual(expectedDateString);
  });

  test("should return empty string on unparseable LinkedIn URL", () => {
    const formattedString = "------------------------";
    const expectedDateString = "";

    const result = shortenerLink({ url: formattedString, link: "" });

    expect(result).toEqual(expectedDateString);
  });
});
