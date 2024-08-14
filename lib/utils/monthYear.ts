const formattedDate = (date: string) => {
  const [year, month] = date.split("-");
  const yearDate = parseInt(year);
  const monthDate = parseInt(month) - 1;

  if (yearDate && monthDate) {
    return new Date(yearDate, monthDate);
  }

  return "Invalid Date";
};

export default function monthYear({ date }: { date: string }): string {
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
}
