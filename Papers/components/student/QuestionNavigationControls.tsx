"use client";

import React from "react";
import { useFormStatus } from "react-dom";

export function QuestionNavigationControls({
  questionNumber,
  questionCount
}: {
  questionNumber: number;
  questionCount: number;
}) {
  const formStatus = useFormStatus();
  const pendingIntent = formStatus.pending ? String(formStatus.data.get("intent") ?? "") : null;
  const isLastQuestion = questionNumber >= questionCount;
  const primaryIntent = isLastQuestion ? "submit" : "next";
  const primaryLabel = isLastQuestion ? "Submit paper" : "Save and next";
  const primaryPendingLabel = pendingIntent === "submit" ? "Submitting..." : "Saving...";

  return (
    <div className="toolbar">
      <button
        type="submit"
        name="intent"
        value="previous"
        className="secondary"
        disabled={formStatus.pending || questionNumber === 1}
      >
        {pendingIntent === "previous" ? "Saving..." : "Previous"}
      </button>
      <button type="submit" name="intent" value={primaryIntent} disabled={formStatus.pending}>
        {pendingIntent === primaryIntent ? primaryPendingLabel : primaryLabel}
      </button>
    </div>
  );
}
