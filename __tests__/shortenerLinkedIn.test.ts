import shortenerLinkedIn from "@/lib/utils/shortenerLinkedIn";

describe("formattedURL`", () => {
  test("should shorten LinkedIn URL", () => {
    const formattedString = "https://www.linkedin.com/in/d-g-h";
    const expectedDateString = "linkedin.com/in/d-g-h";

    const result = shortenerLinkedIn({ url: formattedString });

    expect(result).toEqual(expectedDateString);
  });

  test("should return empty string on unparseable LinkedIn URL", () => {
    const formattedString = "------------------------";
    const expectedDateString = "";

    const result = shortenerLinkedIn({ url: formattedString });

    expect(result).toEqual(expectedDateString);
  });
});
