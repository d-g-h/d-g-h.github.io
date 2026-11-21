const formattedDate = (date: string) => {
  const [year, month] = date.split("-");
  const yearDate = parseInt(year, 10);
  const monthDate = parseInt(month, 10) - 1;

  if (yearDate && monthDate) {
    return new Date(yearDate, monthDate);
  }

  return "Invalid Date";
};

const monthYear = ({ date }: { date: string }): string => {
  const month = formattedDate(date).toLocaleString("en-US", {
    month: "long",
  });

  const year = formattedDate(date).toLocaleString("en-US", {
    year: "numeric",
  });

  if (month !== "Invalid Date" || year !== "Invalid Date") {
    return `${month} ${year}`;
  }

  return "";
};

export default monthYear;
