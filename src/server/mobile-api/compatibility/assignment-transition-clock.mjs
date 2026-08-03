import { createLegacyJakartaClock } from "./timestamps.mjs";

export function createLegacyAssignmentTransitionClock(now = () => new Date()) {
  const clock = createLegacyJakartaClock(now);
  return {
    current() {
      const value = clock.current();
      const [year, month, day] = value.currDate.split("-");
      return {
        ...value,
        compactDate: `${month}${day}${year.slice(-2)}`,
        sequenceSeconds: Math.trunc(
          Date.parse(`${value.currDatetime.replace(" ", "T")}Z`) / 1000,
        ),
      };
    },
  };
}
