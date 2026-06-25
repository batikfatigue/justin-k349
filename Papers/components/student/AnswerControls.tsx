import type { ResponseSchema, StudentAnswer } from "@/lib/domain";

export function AnswerControls({
  partId,
  responseSchema,
  answer
}: {
  partId: string;
  responseSchema: ResponseSchema | null;
  answer: StudentAnswer;
}) {
  const value = typeof answer === "object" && answer && "value" in answer ? answer.value ?? "" : "";

  if (responseSchema?.kind === "single_choice") {
    return (
      <fieldset className="answer-group">
        <legend className="meta">Select one answer</legend>
        {responseSchema.options.map((option) => (
          <label className="radio-row" key={option.value}>
            <input
              type="radio"
              name={`part-${partId}`}
              value={option.value}
              defaultChecked={value === option.value}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (responseSchema?.kind === "code_output_table") {
    const rows = typeof answer === "object" && answer && "rows" in answer ? answer.rows ?? {} : {};

    return (
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Expected output</th>
          </tr>
        </thead>
        <tbody>
          {responseSchema.rows.map((row) => (
            <tr key={row.id}>
              <td>
                <strong>{row.label}</strong>
                {row.prompt ? <p className="meta">{row.prompt}</p> : null}
              </td>
              <td>
                <input name={`part-${partId}-row-${row.id}`} defaultValue={rows[row.id] ?? ""} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (responseSchema?.kind === "error_correction") {
    const lineNumber =
      typeof answer === "object" && answer && "lineNumber" in answer ? answer.lineNumber ?? "" : "";
    const correctedLine =
      typeof answer === "object" && answer && "correctedLine" in answer ? answer.correctedLine ?? "" : "";

    return (
      <div className="grid two">
        <label>
          Line number
          <input name={`part-${partId}-line-number`} defaultValue={lineNumber} />
        </label>
        <label>
          Corrected line
          <input name={`part-${partId}-corrected-line`} defaultValue={correctedLine} />
        </label>
      </div>
    );
  }

  const isCode = responseSchema?.kind === "code_writing";

  return (
    <label>
      Answer
      <textarea
        name={`part-${partId}`}
        className={isCode ? "code-block" : undefined}
        rows={responseSchema?.lines ?? (isCode ? 10 : 5)}
        defaultValue={value}
        spellCheck={!isCode}
      />
    </label>
  );
}
