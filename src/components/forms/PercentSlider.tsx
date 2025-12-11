"use client";
import React from "react";

export default function PercentSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <input
          type="number"
          className="w-24 border rounded px-2 py-1 text-right"
          value={isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
    <input
      type="range"
      className="w-full h-2 accent-forest-600"
      min={min}
      max={max}
      step={step}
      value={isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
