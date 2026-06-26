import { notFound } from "next/navigation";
import { AnswerControls } from "@/components/student/AnswerControls";
import { PromptText } from "@/components/student/PromptText";
import { StimulusRenderer } from "@/components/student/StimulusRenderer";
import { Stopwatch } from "@/components/student/Stopwatch";
import { requireStudentSession } from "@/lib/auth/session";
import { saveQuestionAction } from "@/lib/student/actions";
import { getStudentQuestion } from "@/lib/student/data";

export default async function AttemptQuestionPage({
  params
}: {
  params: { attemptId: string; questionIndex: string };
}) {
  const questionNumber = Number(params.questionIndex);

  if (!Number.isInteger(questionNumber) || questionNumber < 1) {
    notFound();
  }

  const session = requireStudentSession();
  const data = await getStudentQuestion(params.attemptId, questionNumber, session);

  return (
    <main className="section">
      <form action={saveQuestionAction} className="stack">
        <input type="hidden" name="attemptId" value={data.attempt.id} />
        <input type="hidden" name="questionNumber" value={questionNumber} />
        <input type="hidden" name="questionCount" value={data.questionCount} />
        <header className="page-header">
          <p className="eyebrow">{data.paper?.title}</p>
          <div className="toolbar">
            <div>
              <h1>Question {data.question.number}</h1>
              <p className="meta">
                {questionNumber} of {data.questionCount} · {data.question.marks} marks
              </p>
            </div>
            <Stopwatch attemptId={data.attempt.id} initialElapsedSeconds={data.attempt.elapsedSeconds} />
          </div>
        </header>
        <section className="stack">
          <h2>{data.question.title}</h2>
          <StimulusRenderer stimuli={data.question.stimulus} />
        </section>
        {data.parts.map((part) => {
          const leadingStimuli = part.stimulus.filter((stimulus) => stimulus.type === "code");
          const trailingStimuli = part.stimulus.filter((stimulus) => stimulus.type !== "code");

          return (
            <section className="card stack" key={part.id}>
              <div className="stack">
                <h3>
                  {part.label} <span className="meta">[{part.marks}]</span>
                </h3>
                <StimulusRenderer stimuli={leadingStimuli} />
                <PromptText text={part.prompt} />
              </div>
              <StimulusRenderer stimuli={trailingStimuli} />
              <AnswerControls partId={part.id} responseSchema={part.responseSchema} answer={part.answer} />
            </section>
          );
        })}
        <div className="toolbar">
          <button
            type="submit"
            name="intent"
            value="previous"
            className="secondary"
            disabled={questionNumber === 1}
          >
            Previous
          </button>
          {questionNumber < data.questionCount ? (
            <button type="submit" name="intent" value="next">
              Save and next
            </button>
          ) : (
            <button type="submit" name="intent" value="submit">
              Submit paper
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
