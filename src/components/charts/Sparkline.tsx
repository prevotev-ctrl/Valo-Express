"use client";
import React from "react";

export default function Sparkline({
  data,
  width,
  height = 180,
  stroke = "#2A7B59",
  fill = "rgba(62,179,125,0.15)",
  pad = 24,
  id,
  className = "",
  labels,
  secondary,
  unit,
  splitIndex,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  pad?: number;
  id?: string;
  className?: string;
  labels?: string[];
  secondary?: number[];
  unit?: string;
  splitIndex?: number;
}) {
  if (!data || data.length === 0) return null;
  const autoW = width ?? Math.max(360, Math.min(900, data.length * 120));
  const min = Math.min(...data);
  const max = Math.max(...data, ...(secondary ?? []));
  const w = autoW - pad * 2;
  const h = height - pad * 2;
  const scaleX = (i: number) => pad + (data.length === 1 ? w / 2 : (i / (data.length - 1)) * w);
  const scaleY = (v: number) => pad + h - (max === min ? 0.5 * h : ((v - min) / (max - min)) * h);
  const points = data.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ");
  const area = `${pad},${pad + h} ${points} ${pad + w},${pad + h}`;

  return (
    <svg
      id={id}
      className={className}
      width="100%"
      height={height}
      viewBox={`0 0 ${autoW} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={autoW} height={height} fill="white" rx={12} />
      <polyline points={area} fill="url(#spark-fill)" stroke="none" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} />
      {secondary && secondary.length === data.length && (
        <polyline
          points={secondary.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ")}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}
      {data.map((v, i) => (
        <g key={i}>
          <circle cx={scaleX(i)} cy={scaleY(v)} r={3} fill={stroke} />
          <text x={scaleX(i)} y={scaleY(v) - 6} textAnchor="middle" className="text-[9px]" fill="#111">
            {v.toFixed(1)}{unit ? ` ${unit}` : ""}
          </text>
          {labels && (
            <text x={scaleX(i)} y={height - 4} textAnchor="middle" className="text-[9px]" fill="#555">
              {labels[i] || ""}
            </text>
          )}
        </g>
      ))}
      {typeof splitIndex === "number" && splitIndex > 0 && splitIndex < data.length && (
        <line
          x1={scaleX(splitIndex - 1) + (w / (data.length - 1)) / 2}
          x2={scaleX(splitIndex - 1) + (w / (data.length - 1)) / 2}
          y1={pad}
          y2={height - pad}
          stroke="#94a3b8"
          strokeDasharray="4 3"
        />
      )}
      <text x={pad} y={pad + 12} className="text-[10px]" fill="#555">
        {unit ? unit : ""}
      </text>
    </svg>
  );
}
