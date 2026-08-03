const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function parts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function formatLegacyJakartaDate(date) {
  const value = parts(date);
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatLegacyJakartaDatetime(date) {
  const value = parts(date);
  return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}:${value.second}`;
}

export function createLegacyJakartaClock(now = () => new Date()) {
  return {
    current() {
      const date = now();
      return {
        currDatetime: formatLegacyJakartaDatetime(date),
        currDate: formatLegacyJakartaDate(date),
      };
    },
  };
}

export { JAKARTA_TIME_ZONE };
