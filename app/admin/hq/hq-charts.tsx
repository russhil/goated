"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
} from "recharts";
import { formatMoney } from "@/lib/hq";
import { useHqTheme } from "./theme";

// One point on a monthly timeline: numeric x (drives the axis), a display
// label ('Mar 26'), and the INR value for that month.
export type SeriesPoint = {
  x: number; // month index 0..n-1
  label: string; // 'Mon YY'
  value: number; // INR
};

// A single scatter dot pinned to a month (x) and an INR value.
export type DotPoint = { x: number; value: number; name: string };

function compactInr(n: number): string {
  const v = Number(n || 0);
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  if (v >= 1e7) return `₹${fmt(v / 1e7)}Cr`;
  if (v >= 1e5) return `₹${fmt(v / 1e5)}L`;
  if (v >= 1e3) return `₹${fmt(v / 1e3)}k`;
  return `₹${Math.round(v)}`;
}

type TipItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};
type TipProps = {
  active?: boolean;
  payload?: TipItem[];
  label?: number | string;
};

// Reusable single-series area + scatter timeline. The dashboard renders it
// twice (revenue in coral, cost in indigo) from two {x,label,value} arrays.
export function TimeSeriesChart({
  data,
  dots,
  color,
  seriesName,
  dotName,
}: {
  data: SeriesPoint[];
  dots: DotPoint[];
  color: string;
  seriesName: string;
  dotName: string;
}) {
  const { theme } = useHqTheme();
  const dark = theme === "dark";

  const axis = dark ? "#9ca3af" : "#999999";
  const grid = dark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tipBg = dark ? "#17181b" : "#ffffff";
  const tipText = dark ? "#e5e7eb" : "#0D0D0D";
  const tipBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(13,13,13,0.1)";
  const dotStroke = dark ? "#17181b" : "#ffffff";

  // Stable, per-series gradient id so two charts on one page don't collide.
  const gradientId = `ts-grad-${seriesName.replace(/[^a-z0-9]+/gi, "-")}`;

  const hasData = data.some((d) => d.value > 0) || dots.length > 0;

  if (!data.length || !hasData) {
    return (
      <div className="h-[320px] flex items-center justify-center">
        <p className="font-sans text-muted text-sm">
          No dated {seriesName} yet — add sub-projects, expenses or a client kickoff to plot the timeline.
        </p>
      </div>
    );
  }

  const renderTooltip = ({ active, payload, label }: TipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    const idx = Math.round(Number(label));
    const monthLabel = data[idx]?.label ?? "";
    return (
      <div
        style={{
          background: tipBg,
          color: tipText,
          border: `1px solid ${tipBorder}`,
          borderRadius: 12,
          padding: "10px 12px",
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          minWidth: 150,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: axis,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {monthLabel}
        </p>
        {payload.map((p, i) => {
          const row = (p.payload ?? {}) as Partial<DotPoint>;
          const isDot = typeof row.name === "string";
          const name = isDot ? (row.name as string) : p.name ?? "";
          return (
            <div
              key={`${name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: i ? 4 : 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: p.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, opacity: isDot ? 0.75 : 1 }}>{name}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatMoney(Number(p.value), "INR")}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={dark ? 0.35 : 0.26} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[-0.5, data.length - 0.5]}
          ticks={data.map((d) => d.x)}
          tickFormatter={(v: number) => data[v]?.label ?? ""}
          tick={{ fontSize: 11, fill: axis, fontFamily: "var(--font-mono)" }}
          axisLine={{ stroke: grid }}
          tickLine={false}
          minTickGap={10}
          interval="preserveStartEnd"
        />
        <YAxis
          type="number"
          tick={{ fontSize: 11, fill: axis, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={compactInr}
          width={56}
        />
        {/* Fixed, small dot size for the scatter series. */}
        <ZAxis range={[36, 36]} />

        <Tooltip
          content={renderTooltip as never}
          cursor={{ stroke: grid, strokeWidth: 1 }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: axis,
            paddingTop: 8,
          }}
        />

        <Area
          type="monotone"
          dataKey="value"
          name={seriesName}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />

        <Scatter
          name={dotName}
          data={dots}
          dataKey="value"
          fill={color}
          stroke={dotStroke}
          strokeWidth={1}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
