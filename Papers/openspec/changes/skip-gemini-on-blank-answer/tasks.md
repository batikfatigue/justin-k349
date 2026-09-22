## 1. Marking Logic

- [x] 1.1 Add a server-side blank-answer helper for text-like student answers that treats empty and whitespace-only values as blank.
- [x] 1.2 Short-circuit `rubric_ai` marking before `requestGeminiMark` when the submitted answer is blank.
- [x] 1.3 Return a completed zero-score `MarkingResult` for blank rubric answers with safe student feedback, tutor rationale, no missing rubric points, and no exact-marking details.

## 2. Regression Coverage

- [x] 2.1 Add a marking test proving an empty rubric answer returns a marked zero result without calling the Gemini generator.
- [x] 2.2 Add a marking test proving a whitespace-only rubric answer returns a marked zero result without calling the Gemini generator.
- [x] 2.3 Add or preserve coverage proving a non-blank rubric answer still calls Gemini and stores the returned mark.

## 3. Verification

- [x] 3.1 Run the relevant marking test suite.
- [x] 3.2 Run OpenSpec validation/status for `skip-gemini-on-blank-answer`.
