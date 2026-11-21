type TimeProps = {
  start: string;
  end?: string;
};

import monthYear from "@/lib/utils/monthYear";

export default function Time({ start, end }: Readonly<TimeProps>) {
  return (
    <>
      <time dateTime={start}>{monthYear({ date: start })}</time>
      {end ? (
        <>
          <span>{" - "}</span>
          <time dateTime={end}>{monthYear({ date: end })}</time>
        </>
      ) : (
        " - present"
      )}
    </>
  );
}
