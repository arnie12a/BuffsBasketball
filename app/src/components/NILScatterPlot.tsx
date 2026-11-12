
import { useEffect, useMemo, useRef, useState } from "react";
import { placeLogos } from "../utils/logoPlacement";

type Point = {
  team: string;
  height: number;
  spend: number;
  count: number;
  logo: string | null;
};

type Props = {
  points: Point[];
  onSelectTeam: (team: string) => void;
};

const CHART_HEIGHT = 600;
const LOGO_SIZE = 44;

const MARGIN = {
  top: 55,
  right: 55,
  bottom: 75,
  left: 85,
};

function formatHeight(inches: number) {
  const value = Math.round(inches);
  return `${Math.floor(value / 12)}'${value % 12}"`;
}

// Calculate compact axis limits from the data
function getBounds(values: number[], paddingRatio = 0.12) {
  if (!values.length) return [0, 1] as const;

  const min = Math.min(...values);
  const max = Math.max(...values);

  const range = max - min;

  // Avoid a zero-width axis when values are identical
  const padding = Math.max(
    range * paddingRatio,
    range === 0 ? 1 : 0
  );

  return [
    min - padding,
    max + padding,
  ] as const;
}

// Generate evenly spaced tick values
function makeTicks(min: number, max: number, count = 6) {
  return Array.from(
    { length: count },
    (_, i) => min + ((max - min) * i) / (count - 1)
  );
}

// Curved connector from true point toward displaced logo
function connectorPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  logoSize: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);

  if (distance < 1) return "";

  // Stop line before entering the logo
  const stopDistance = Math.max(
    0,
    distance - logoSize / 2 - 3
  );

  const endX = x1 + (dx / distance) * stopDistance;
  const endY = y1 + (dy / distance) * stopDistance;

  // Subtle perpendicular curvature
  const curve = Math.min(12, distance * 0.08);

  const midX = (x1 + endX) / 2;
  const midY = (y1 + endY) / 2;

  const controlX = midX - (dy / distance) * curve;
  const controlY = midY + (dx / distance) * curve;

  return `M ${x1} ${y1} Q ${controlX} ${controlY} ${endX} ${endY}`;
}

export default function NILScatterPlot({
  points,
  onSelectTeam,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(1000);
  const [hovered, setHovered] = useState<string | null>(null);

  // Responsive chart width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const measuredWidth = entries[0].contentRect.width;
      if (measuredWidth > 0) {
        setWidth(Math.max(700, measuredWidth));
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Dynamic axis limits
  const heights = points.map((p) => p.height);
  const spending = points.map((p) => p.spend);

  const [xMin, xMax] = getBounds(heights, 0.15);
  const [yMin, yMax] = getBounds(spending, 0.15);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight =
    CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = (value: number) =>
    MARGIN.left +
    ((value - xMin) / (xMax - xMin)) * plotWidth;

  const yScale = (value: number) =>
    MARGIN.top +
    (1 - (value - yMin) / (yMax - yMin)) * plotHeight;

  // Place logos without overlap
  const placed = useMemo(() => {
    const pixels = points.map((p) => ({
      team: p.team,
      x: xScale(p.height),
      y: yScale(p.spend),
    }));

    return placeLogos(
      pixels,
      width,
      CHART_HEIGHT,
      LOGO_SIZE,
      10
    );
  }, [points, width, xMin, xMax, yMin, yMax]);

  const placementMap = Object.fromEntries(
    placed.map((p) => [p.team, p])
  );

  // this is new
  const xTicks = Array.from(
    {
      length:
        Math.floor(xMax) - Math.ceil(xMin) + 1
    },
    (_, i) => Math.ceil(xMin) + i
  );  
  const yTicks = makeTicks(yMin, yMax);

  const hoveredPoint = points.find(
    (p) => p.team === hovered
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflowX: "auto",
        position: "relative",
        background: "#ffffff",
      }}
    >
      <svg
        width={width}
        height={CHART_HEIGHT}
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Big 12 NIL spending versus average player height"
        style={{ display: "block" }}
      >
        {/* Horizontal grid lines */}
        {yTicks.map((tick, index) => (
          <g key={`y-${index}`}>
            <line
              x1={MARGIN.left}
              y1={yScale(tick)}
              x2={width - MARGIN.right}
              y2={yScale(tick)}
              stroke="#e9e5dc"
              strokeDasharray="3 5"
            />

            <text
              x={MARGIN.left - 14}
              y={yScale(tick) + 4}
              textAnchor="end"
              fontSize="12"
              fill="#565a5c"
            >
              ${tick.toFixed(1)}M
            </text>
          </g>
        ))}

        {/* Vertical grid lines */}
        {xTicks.map((tick, index) => (
          <g key={`x-${index}`}>
            <line
              x1={xScale(tick)}
              y1={MARGIN.top}
              x2={xScale(tick)}
              y2={CHART_HEIGHT - MARGIN.bottom}
              stroke="#e9e5dc"
              strokeDasharray="3 5"
            />

            <text
              x={xScale(tick)}
              y={CHART_HEIGHT - MARGIN.bottom + 25}
              textAnchor="middle"
              fontSize="12"
              fill="#565a5c"
            >
              {formatHeight(tick)}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={CHART_HEIGHT - 16}
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          fill="#111"
        >
          Average Player Height
        </text>

        <text
          x={22}
          y={CHART_HEIGHT / 2}
          transform={`rotate(-90 22 ${CHART_HEIGHT / 2})`}
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          fill="#111"
        >
          Estimated NIL Spending ($ Millions)
        </text>

        {/* Curved connector lines */}
        {points.map((point) => {
          const pos = placementMap[point.team];

          if (!pos?.displaced) return null;

          const path = connectorPath(
            pos.x,
            pos.y,
            pos.displayX,
            pos.displayY,
            LOGO_SIZE
          );

          return (
            <path
              key={`connector-${point.team}`}
              d={path}
              fill="none"
              stroke="#8d7334"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.65"
            />
          );
        })}

        {/* True data positions */}
        {points.map((point) => {
          const pos = placementMap[point.team];

          if (!pos) return null;

          return (
            <circle
              key={`point-${point.team}`}
              cx={pos.x}
              cy={pos.y}
              r={3.5}
              fill="#8d7334"
              stroke="white"
              strokeWidth="1"
            />
          );
        })}

        {/* Team logos */}
        {points.map((point) => {
          const pos = placementMap[point.team];

          if (!pos) return null;

          return (
            <g
              key={point.team}
              onClick={() => onSelectTeam(point.team)}
              onMouseEnter={() => setHovered(point.team)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* White background for logo readability */}
              <circle
                cx={pos.displayX}
                cy={pos.displayY}
                r={LOGO_SIZE / 2 + 3}
                fill="#ffffff"
                stroke="#e5e0d5"
                strokeWidth="1"
              />

              {point.logo ? (
                <image
                  href={`${import.meta.env.BASE_URL}${point.logo}`}
                  x={pos.displayX - LOGO_SIZE / 2}
                  y={pos.displayY - LOGO_SIZE / 2}
                  width={LOGO_SIZE}
                  height={LOGO_SIZE}
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <circle
                  cx={pos.displayX}
                  cy={pos.displayY}
                  r={12}
                  fill="#cfb87c"
                />
              )}

              <circle
                cx={pos.displayX}
                cy={pos.displayY}
                r={LOGO_SIZE / 2 + 5}
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#111111",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.7,
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          <strong>{hoveredPoint.team}</strong>
          <div>
            Height: {formatHeight(hoveredPoint.height)}
          </div>
          <div>
            NIL: ${hoveredPoint.spend.toFixed(2)}M
          </div>
          <div>
            Players: {hoveredPoint.count}
          </div>
        </div>
      )}
    </div>
  );
}
