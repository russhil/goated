"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
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

// A monthly row: numeric x (drives the axis), a display label ('Mar 26'), and
// one INR number per series key present on the chart.
export type ChartRow = { x: number; label: string; [key: string]: number | string };

export type SeriesDef = {
  key: string; // matches a numeric key on ChartRow
  name: string; // legend label
  color: string;
  area?: boolean; // filled area (revenue) vs plain line (cost series)
};

// One scatter dot pinned to a month (x) + INR value. `breakdown` powers the
// hover detail — e.g. a client's sub-projects.
export type DotPoint = {
  x: number;
  value: number;
  name: string;
  breakdown?: { label: string; value: number }[];
};

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
type TipProps = { active?: boolean; payload?: TipItem[]; label?: number | string };

export function TimeSeriesChart({
  data,
  series,
  dots,
  dotName,
  dotColor,
}: {
  data: ChartRow[];
  series: SeriesDef[];
  dots: DotPoint[];
  dotName: string;
  dotColor: string;
}) {
  const { theme } = useHqTheme();
  const dark = theme === "dark";

  const axis = dark ? "#9ca3af" : "#999999";
  const grid = dark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tipBg = dark ? "#17181b" : "#ffffff";
  const tipText = dark ? "#e5e7eb" : "#0D0D0D";
  const tipBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(13,13,13,0.1)";
  const dotStroke = dark ? "#17181b" : "#ffffff";

  const hasData =
    data.some((d) => series.some((s) => Number(d[s.key]) > 0)) || dots.length > 0;

  if (!data.length || !hasData) {
    return (
      <div className="h-[320px] flex items-center justify-center">
        <p className="font-sans text-muted text-sm">
          Nothing to plot yet — add clients with a kickoff date, revenue, or expenses.
        </p>
      </div>
    );
  }

  const renderTooltip = ({ active, payload, label }: TipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    const idx = Math.round(Number(label));
    const monthLabel = data[idx]?.label ?? "";

    // Split into line/area series rows vs scatter dots (dots carry a `name`).
    const seriesItems = payload.filter((p) => !(p.payload && typeof (p.payload as DotPoint).name === "string"));
    const dotItems = payload
      .filter((p) => p.payload && typeof (p.payload as DotPoint).name === "string")
      .map((p) => p.payload as unknown as DotPoint);

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
          minWidth: 170,
          maxWidth: 280,
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

        {seriesItems.map((p, i) => (
          <div key={`s-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: i ? 4 : 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{p.name}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(Number(p.value), "INR")}</span>
          </div>
        ))}

        {dotItems.map((d, i) => (
          <div key={`d-${i}`} style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${tipBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, display: "inline-block", flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 600 }}>{d.name}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(Number(d.value), "INR")}</span>
            </div>
            {d.breakdown && d.breakdown.length > 0 && (
              <div style={{ marginTop: 3, paddingLeft: 16 }}>
                {d.breakdown.map((b, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, opacity: 0.7, fontSize: 11 }}>
                    <span style={{ flex: 1 }}>{b.label}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(Number(b.value), "INR")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 8 }}>
        <defs>
          {series
            .filter((s) => s.area)
            .map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={dark ? 0.35 : 0.26} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
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
        <ZAxis range={[42, 42]} />

        <Tooltip content={renderTooltip as never} cursor={{ stroke: grid, strokeWidth: 1 }} />
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

        {series.map((s) =>
          s.area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          )
        )}

        <Scatter name={dotName} data={dots} dataKey="value" fill={dotColor} stroke={dotStroke} strokeWidth={1} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
