"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  importPaperAction,
  initialImportFormState,
  type ImportFormState
} from "@/app/admin/import/actions";

function SubmitButtons() {
  const status = useFormStatus();

  return (
    <div className="toolbar">
      <button type="submit" name="intent" value="validate" disabled={status.pending}>
        Validate
      </button>
      <button type="submit" name="intent" value="import" className="secondary" disabled={status.pending}>
        Import
      </button>
    </div>
  );
}

function Summary({ state }: { state: ImportFormState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "error") {
    return (
      <div className="notice error">
        <p>{state.message}</p>
        <ul>
          {state.errors?.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="notice success">
      <p>{state.message}</p>
      {state.summary ? (
        <dl className="grid two">
          <div>
            <dt>Title</dt>
            <dd>{state.summary.title}</dd>
          </div>
          <div>
            <dt>Syllabus</dt>
            <dd>{state.summary.syllabus}</dd>
          </div>
          <div>
            <dt>Access codes</dt>
            <dd>{state.summary.accessCodeCount}</dd>
          </div>
          <div>
            <dt>Questions</dt>
            <dd>{state.summary.questionCount}</dd>
          </div>
          <div>
            <dt>Parts</dt>
            <dd>{state.summary.partCount}</dd>
          </div>
          <div>
            <dt>Total marks</dt>
            <dd>{state.summary.totalMarks}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

export function ImportForm() {
  const [state, formAction] = useFormState(importPaperAction, initialImportFormState);

  return (
    <form action={formAction} className="stack">
      <Summary state={state} />
      <label>
        Paper JSON
        <textarea
          name="paperJson"
          spellCheck={false}
          defaultValue={state.jsonText}
          placeholder='{"schemaVersion":"1.0","paperId":"k349-g3-computing-practice-1",...}'
          required
        />
      </label>
      <SubmitButtons />
    </form>
  );
}
