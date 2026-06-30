"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  initialPaperUpdateFormState,
  type PaperUpdateFormState
} from "@/app/admin/papers/form-state";

type PaperUpdateAction = (
  previousState: PaperUpdateFormState,
  formData: FormData
) => Promise<PaperUpdateFormState>;

export function PaperUpdateForm({
  action,
  initialJsonText
}: {
  action: PaperUpdateAction;
  initialJsonText: string;
}) {
  const [state, formAction] = useFormState(action, {
    ...initialPaperUpdateFormState,
    jsonText: initialJsonText
  });

  return (
    <form action={formAction} className="stack">
      <UpdateSummary state={state} />
      <label>
        Paper JSON
        <textarea
          name="paperJson"
          className="json-editor"
          spellCheck={false}
          defaultValue={state.jsonText}
          required
        />
      </label>
      <SubmitButtons />
    </form>
  );
}

function SubmitButtons() {
  const status = useFormStatus();

  return (
    <div className="toolbar">
      <button type="submit" name="intent" value="validate" disabled={status.pending}>
        Validate
      </button>
      <button type="submit" name="intent" value="update" className="secondary" disabled={status.pending}>
        Update paper
      </button>
    </div>
  );
}

function UpdateSummary({ state }: { state: PaperUpdateFormState }) {
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
