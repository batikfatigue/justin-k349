import type { Stimulus } from "@/lib/domain";

export function StimulusRenderer({ stimuli }: { stimuli: Stimulus[] }) {
  if (!stimuli.length) {
    return null;
  }

  return (
    <div className="stack">
      {stimuli.map((stimulus, index) => (
        <section className="stimulus" key={`${stimulus.type}-${index}`}>
          {"title" in stimulus && stimulus.title ? <h3>{stimulus.title}</h3> : null}
          {stimulus.type === "text" ? <p className="body-copy">{stimulus.text}</p> : null}
          {stimulus.type === "code" ? (
            <pre className="code-block">
              <code>{stimulus.code}</code>
            </pre>
          ) : null}
          {stimulus.type === "expected_output" ? (
            <pre className="expected-output">
              <code>{stimulus.output}</code>
            </pre>
          ) : null}
          {stimulus.type === "table" ? (
            <table>
              <thead>
                <tr>
                  {stimulus.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stimulus.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>
                        <span style={{ whiteSpace: "pre-wrap" }}>{cell}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {stimulus.type === "flowchart" ? (
            <div className="flowchart">
              {stimulus.nodes.map((node) => (
                <div className="flow-node" key={node.id}>
                  <p className="meta">{node.kind}</p>
                  <p>{node.text}</p>
                </div>
              ))}
              <table aria-label="Flowchart edges">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Label</th>
                  </tr>
                </thead>
                <tbody>
                  {stimulus.edges.map((edge, edgeIndex) => (
                    <tr key={edgeIndex}>
                      <td>{edge.from}</td>
                      <td>{edge.to}</td>
                      <td>{edge.label ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
