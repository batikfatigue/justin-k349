import type { Stimulus } from "@/lib/domain";

type FlowchartStimulus = Extract<Stimulus, { type: "flowchart" }>;
type FlowchartNode = FlowchartStimulus["nodes"][number];
type FlowchartEdge = FlowchartStimulus["edges"][number];

type PositionedFlowchartNode = FlowchartNode & {
  height: number;
  lines: string[];
  rank: number;
  width: number;
  x: number;
  y: number;
};

const FLOWCHART_PADDING_X = 96;
const FLOWCHART_PADDING_Y = 34;
const FLOWCHART_COLUMN_GAP = 90;
const FLOWCHART_ROW_GAP = 58;
const FLOWCHART_LOOP_GAP = 46;
const FLOWCHART_MIN_WIDTH = 640;
const FLOWCHART_TEXT_LINE_HEIGHT = 18;

const FLOWCHART_NODE_WIDTHS: Record<FlowchartNode["kind"], number> = {
  terminal: 176,
  input: 268,
  output: 268,
  process: 236,
  decision: 230
};

const FLOWCHART_TEXT_WIDTHS: Record<FlowchartNode["kind"], number> = {
  terminal: 18,
  input: 28,
  output: 28,
  process: 24,
  decision: 22
};

function wrapFlowchartText(text: string, maxCharacters: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    if (!currentLine) {
      currentLine = word;
      return;
    }

    if (`${currentLine} ${word}`.length <= maxCharacters) {
      currentLine = `${currentLine} ${word}`;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.flatMap((line) => {
    if (line.length <= maxCharacters) {
      return line;
    }

    const chunks: string[] = [];
    for (let index = 0; index < line.length; index += maxCharacters) {
      chunks.push(line.slice(index, index + maxCharacters));
    }

    return chunks;
  });
}

function flowchartNodeHeight(kind: FlowchartNode["kind"], lineCount: number) {
  const textHeight = lineCount * FLOWCHART_TEXT_LINE_HEIGHT + 30;

  if (kind === "decision") {
    return Math.max(112, textHeight + 24);
  }

  return Math.max(kind === "terminal" ? 58 : 68, textHeight);
}

function getFlowchartRanks(nodes: FlowchartNode[], edges: FlowchartEdge[]) {
  const rankById = new Map<string, number>();
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incomingCounts = new Map(nodes.map((node) => [node.id, 0]));
  const outgoingEdges = new Map<string, FlowchartEdge[]>();

  edges.forEach((edge) => {
    if (nodeIds.has(edge.to)) {
      incomingCounts.set(edge.to, (incomingCounts.get(edge.to) ?? 0) + 1);
    }

    outgoingEdges.set(edge.from, [...(outgoingEdges.get(edge.from) ?? []), edge]);
  });

  const roots = nodes.filter((node) => (incomingCounts.get(node.id) ?? 0) === 0);
  const queue = (roots.length ? roots : nodes.slice(0, 1)).map((node) => {
    rankById.set(node.id, 0);
    return node.id;
  });

  while (queue.length) {
    const nodeId = queue.shift()!;
    const rank = rankById.get(nodeId) ?? 0;

    (outgoingEdges.get(nodeId) ?? []).forEach((edge) => {
      if (rankById.has(edge.to)) {
        return;
      }

      rankById.set(edge.to, rank + 1);
      queue.push(edge.to);
    });
  }

  const fallbackRank = Math.max(0, ...rankById.values()) + 1;
  nodes.forEach((node) => {
    if (!rankById.has(node.id)) {
      rankById.set(node.id, fallbackRank);
    }
  });

  return rankById;
}

export function buildFlowchartLayout(stimulus: FlowchartStimulus) {
  const rankById = getFlowchartRanks(stimulus.nodes, stimulus.edges);
  const incomingEdgeOrder = new Map<string, number>();

  stimulus.edges.forEach((edge, index) => {
    if (!incomingEdgeOrder.has(edge.to)) {
      incomingEdgeOrder.set(edge.to, index);
    }
  });

  const measuredNodes = stimulus.nodes.map((node, index) => {
    const lines = wrapFlowchartText(node.text, FLOWCHART_TEXT_WIDTHS[node.kind]);
    const width = FLOWCHART_NODE_WIDTHS[node.kind];
    const height = flowchartNodeHeight(node.kind, lines.length);

    return {
      ...node,
      height,
      index,
      lines,
      rank: rankById.get(node.id) ?? 0,
      width
    };
  });

  const ranks = [...new Set(measuredNodes.map((node) => node.rank))].sort((left, right) => left - right);
  const nodesByRank = ranks.map((rank) =>
    measuredNodes
      .filter((node) => node.rank === rank)
      .sort(
        (left, right) =>
          (incomingEdgeOrder.get(left.id) ?? left.index) - (incomingEdgeOrder.get(right.id) ?? right.index)
      )
  );
  const rowWidths = nodesByRank.map(
    (row) => row.reduce((total, node) => total + node.width, 0) + Math.max(0, row.length - 1) * FLOWCHART_COLUMN_GAP
  );
  const width = Math.max(FLOWCHART_MIN_WIDTH, Math.max(...rowWidths) + FLOWCHART_PADDING_X * 2);
  let nextY = FLOWCHART_PADDING_Y;
  const positionedNodes: PositionedFlowchartNode[] = [];

  nodesByRank.forEach((row, rowIndex) => {
    const rowHeight = Math.max(...row.map((node) => node.height));
    let nextX = (width - rowWidths[rowIndex]) / 2;

    row.forEach((node) => {
      positionedNodes.push({
        ...node,
        x: nextX,
        y: nextY + (rowHeight - node.height) / 2
      });
      nextX += node.width + FLOWCHART_COLUMN_GAP;
    });

    nextY += rowHeight + FLOWCHART_ROW_GAP;
  });

  return {
    height: nextY - FLOWCHART_ROW_GAP + FLOWCHART_PADDING_Y,
    nodes: positionedNodes,
    width
  };
}

function FlowchartDiagram({
  markerId,
  stimulus
}: {
  markerId: string;
  stimulus: FlowchartStimulus;
}) {
  const layout = buildFlowchartLayout(stimulus);
  const nodesById = new Map(layout.nodes.map((node) => [node.id, node]));
  const titleId = `${markerId}-title`;

  return (
    <div className="flowchart" aria-label={stimulus.title ?? "Flowchart"}>
      <svg
        aria-labelledby={titleId}
        className="flowchart-diagram"
        role="img"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        <title id={titleId}>{stimulus.title ?? "Flowchart"}</title>
        <defs>
          <marker
            id={markerId}
            markerHeight="10"
            markerUnits="strokeWidth"
            markerWidth="10"
            orient="auto"
            refX="9"
            refY="5"
            viewBox="0 0 10 10"
          >
            <path className="flowchart-arrow-head" d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <g className="flowchart-connectors">
          {stimulus.edges.map((edge, edgeIndex) => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);

            if (!from || !to) {
              return null;
            }

            return <FlowchartConnector edge={edge} key={edgeIndex} markerId={markerId} from={from} to={to} />;
          })}
        </g>
        <g className="flowchart-nodes">
          {layout.nodes.map((node) => (
            <FlowchartNodeShape key={node.id} node={node} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function FlowchartConnector({
  edge,
  from,
  markerId,
  to
}: {
  edge: FlowchartEdge;
  from: PositionedFlowchartNode;
  markerId: string;
  to: PositionedFlowchartNode;
}) {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  let path = "";
  let labelX = (fromCenterX + toCenterX) / 2;
  let labelY = (fromCenterY + toCenterY) / 2 - 8;

  if (to.rank > from.rank) {
    const start = { x: fromCenterX, y: from.y + from.height };
    const end = { x: toCenterX, y: to.y };

    if (Math.abs(start.x - end.x) < 1) {
      path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      labelX = start.x + 18;
      labelY = (start.y + end.y) / 2 - 8;
    } else {
      const middleY = start.y + Math.max(28, (end.y - start.y) / 2);
      path = `M ${start.x} ${start.y} L ${start.x} ${middleY} L ${end.x} ${middleY} L ${end.x} ${end.y}`;
      labelX = (start.x + end.x) / 2;
      labelY = middleY - 8;
    }
  } else {
    const useLeftRoute = fromCenterX <= toCenterX;
    const routeX = useLeftRoute
      ? Math.min(from.x, to.x) - FLOWCHART_LOOP_GAP
      : Math.max(from.x + from.width, to.x + to.width) + FLOWCHART_LOOP_GAP;
    const start = {
      x: useLeftRoute ? from.x : from.x + from.width,
      y: fromCenterY
    };
    const end = {
      x: useLeftRoute ? to.x : to.x + to.width,
      y: toCenterY
    };

    path = `M ${start.x} ${start.y} L ${routeX} ${start.y} L ${routeX} ${end.y} L ${end.x} ${end.y}`;
    labelX = routeX + (useLeftRoute ? -16 : 16);
    labelY = (start.y + end.y) / 2 - 8;
  }

  return (
    <g>
      <path className="flowchart-connector" d={path} markerEnd={`url(#${markerId})`} />
      {edge.label ? (
        <text className="flowchart-edge-label" textAnchor="middle" x={labelX} y={labelY}>
          {edge.label}
        </text>
      ) : null}
    </g>
  );
}

function FlowchartNodeShape({ node }: { node: PositionedFlowchartNode }) {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const textY = centerY - ((node.lines.length - 1) * FLOWCHART_TEXT_LINE_HEIGHT) / 2 + 5;

  return (
    <g className={`flowchart-node flowchart-node-${node.kind}`}>
      {node.kind === "terminal" ? (
        <rect height={node.height} rx={node.height / 2} width={node.width} x={node.x} y={node.y} />
      ) : null}
      {node.kind === "input" || node.kind === "output" ? (
        <polygon
          points={`${node.x + 26},${node.y} ${node.x + node.width},${node.y} ${node.x + node.width - 26},${
            node.y + node.height
          } ${node.x},${node.y + node.height}`}
        />
      ) : null}
      {node.kind === "process" ? (
        <rect height={node.height} width={node.width} x={node.x} y={node.y} />
      ) : null}
      {node.kind === "decision" ? (
        <polygon
          points={`${centerX},${node.y} ${node.x + node.width},${centerY} ${centerX},${node.y + node.height} ${
            node.x
          },${centerY}`}
        />
      ) : null}
      <text className="flowchart-node-text" textAnchor="middle">
        {node.lines.map((line, lineIndex) => (
          <tspan key={lineIndex} x={centerX} y={textY + lineIndex * FLOWCHART_TEXT_LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

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
            <FlowchartDiagram markerId={`flowchart-arrow-${index}`} stimulus={stimulus} />
          ) : null}
        </section>
      ))}
    </div>
  );
}
