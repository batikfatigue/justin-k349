export const abandonedAfterSeconds = 30 * 60;

export function displayAttemptStatus(status: string, lastSeenAt: Date) {
  if (status === "in_progress") {
    const secondsSinceSeen = (Date.now() - lastSeenAt.getTime()) / 1000;

    if (secondsSinceSeen > abandonedAfterSeconds) {
      return "abandoned";
    }
  }

  return status;
}
