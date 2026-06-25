"use client";

import { useEffect, useRef, useState } from "react";

export function Stopwatch({
  attemptId,
  initialElapsedSeconds
}: {
  attemptId: string;
  initialElapsedSeconds: number;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const latestElapsed = useRef(initialElapsedSeconds);

  useEffect(() => {
    latestElapsed.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const heartbeat = window.setInterval(() => {
      void fetch(`/api/attempts/${attemptId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: latestElapsed.current })
      });
    }, 15_000);

    return () => window.clearInterval(heartbeat);
  }, [attemptId]);

  return (
    <div className="row" aria-live="polite">
      <span className="status-pill">Time {formatElapsed(elapsedSeconds)}</span>
      <input type="hidden" name="elapsedSeconds" value={elapsedSeconds} readOnly />
    </div>
  );
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
