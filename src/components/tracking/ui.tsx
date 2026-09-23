'use client'

import type { ReactNode } from "react";

/** iOS-style slider: yellow fill (like the Camera exposure slider), white knob. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block select-none">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="text-white/65">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-white/90">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tw-range w-full"
        style={{ ["--p" as string]: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </label>
  );
}

/** iOS switch — turns Camera-yellow when on, like the in-viewfinder toggles. */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1 text-left text-[13px] text-white/85"
    >
      <span>{label}</span>
      <span
        className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-lock" : "bg-[#39393d]"
        }`}
      >
        <span
          className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-[left] duration-200 ease-ios ${
            checked ? "left-[18px]" : "left-[2px]"
          }`}
        />
      </span>
    </button>
  );
}

/** iOS segmented control. */
export function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-[9px] bg-white/[0.06] p-[2px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[7px] px-1.5 py-1 text-[11.5px] font-medium transition-all duration-200 ${
            value === o.value
              ? "bg-[#636366] text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
              : "text-white/55 hover:text-white/85"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Inset-grouped card, like a section in iOS Settings. */
export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[14px] bg-[#1c1c1e] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white/45">{title}</h3>
        {right}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 transition-colors duration-200 ${
        active ? "bg-lock/15 text-lock ring-lock/50" : "bg-white/[0.06] text-white/65 ring-white/10 hover:bg-white/[0.1]"
      }`}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}
