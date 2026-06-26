import React, { Fragment } from "react";

export function PromptText({ text }: { text: string }) {
  const paragraphs = text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return null;
  }

  return (
    <div className="prompt-copy">
      {paragraphs.map((paragraph, paragraphIndex) => (
        <p className="body-copy" key={paragraphIndex}>
          {paragraph.split("\n").map((line, lineIndex) => (
            <Fragment key={lineIndex}>
              {lineIndex > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
