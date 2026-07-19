"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Scatter,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
} from "recharts";
import { useState } from "react";
import { formatMoney } from "@/lib/hq";
import { useHqTheme } from "./theme";

// A monthly row: numeric x (drives the axis), a display label ('Mar 26'), and
// one INR number per series key present on the chart.
export type ChartRow = { x: number; label: string; [key: string]: number | string };

// One stacked band + one legend chip.
export type StackSeries = { key: string; name: string; color: string };
// A line-item behind a single (series, month) cell — powers the detail panel.
// `details` is keyed "<series.key>|<x>".
export type StackDetail = { label: string; date?: string; amount: number };

function compactInr(n: number): string {
  const v = Number(n || 0);
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  if (v >= 1e7) return `₹${fmt(v / 1e7)}Cr`;
  if (v >= 1e5) return `₹${fmt(v / 1e5)}L`;
  if (v >= 1e3) return `₹${fmt(v / 1e3)}k`;
  return `₹${Math.round(v)}`;
}

type TipProps = { active?: boolean; label?: number | string };

// Shared pill styling for the y-axis tick stepper (matches the kanban steppers).
const STEP_BTN =
  "w-6 h-6 flex items-center justify-center rounded-full text-sm bg-dark/[0.04] text-dark/70 hover:bg-dark/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

// A stacked-area timeline shared by the revenue and cost charts: one band per
// series in its own color (straight segments, so a gap month returns to zero
// instead of a monotone curve bridging it), a total top line, hover splits, a
// click-a-dot line-item detail panel, per-series muting via legend chips, and
// an adjustable y-axis tick count. `details` is keyed "<series.key>|<x>".
export function StackedChart({
  data,
  series,
  details,
}: {
  data: ChartRow[];
  series: StackSeries[];
  details: Record<string, StackDetail[]>;
}) {
  const { theme } = useHqTheme();
  const dark = theme === "dark";
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [tickCount, setTickCount] = useState(6);
  const [selected, setSelected] = useState<{ key: string; x: number } | null>(null);

  const axis = dark ? "#9ca3af" : "#999999";
  const grid = dark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tipBg = dark ? "#17181b" : "#ffffff";
  const tipText = dark ? "#e5e7eb" : "#0D0D0D";
  const tipBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(13,13,13,0.1)";
  const totalColor = dark ? "#f0f0f0" : "#0D0D0D";

  const visible = series.filter((s) => !hidden.has(s.key));
  const rows = data.map((r) => ({
    ...r,
    _total: visible.reduce((t, s) => t + Number(r[s.key] || 0), 0),
  }));
  const maxTotal = Math.max(0, ...rows.map((r) => r._total));
  const yMax = maxTotal > 0 ? maxTotal * 1.1 : 1;

  // Dots sit on each visible band's running-total top, recomputed here so muting
  // a series drops every dot stacked above it back down and off the axis.
  type Dot = {
    x: number;
    y: number;
    key: string;
    name: string;
    color: string;
    amount: number;
    label: string;
  };
  const dots: Dot[] = [];
  for (const row of data) {
    let cumulative = 0;
    for (const s of visible) {
      const v = Number(row[s.key] || 0);
      cumulative += v;
      if (v > 0) {
        dots.push({
          x: row.x,
          y: cumulative,
          key: s.key,
          name: s.name,
          color: s.color,
          amount: v,
          label: String(row.label),
        });
      }
    }
  }

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const showEmpty = !data.length || (maxTotal <= 0 && dots.length === 0);

  // Tooltip = the hovered month's TOTAL (visible bands) + the per-series split.
  const renderTooltip = ({ active, label }: TipProps) => {
    if (!active || label == null) return null;
    const idx = Math.round(Number(label));
    const row = data[idx];
    if (!row) return null;
    const parts = visible
      .map((s) => ({ name: s.name, color: s.color, value: Number(row[s.key] || 0) }))
      .filter((p) => p.value > 0);
    const total = parts.reduce((t, p) => t + p.value, 0);
    if (total <= 0) return null;

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
          minWidth: 190,
          maxWidth: 300,
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
          {String(row.label)}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            marginBottom: parts.length ? 6 : 0,
          }}
        >
          <span style={{ flex: 1 }}>Total</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(total, "INR")}</span>
        </div>
        {parts.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: i ? 4 : 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{p.name}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(p.value, "INR")}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Controls: legend chips (mute/unmute) + y-axis tick stepper. These
          replace recharts' <Legend>. */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              className={`inline-flex items-center gap-1.5 font-mono text-[11px] cursor-pointer ${
                hidden.has(s.key) ? "opacity-40 line-through" : "text-dark"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted uppercase tracking-widest">{"// y-axis"}</span>
          <button
            type="button"
            onClick={() => setTickCount((t) => Math.max(3, t - 1))}
            disabled={tickCount <= 3}
            className={STEP_BTN}
            aria-label="Fewer gridlines"
          >
            −
          </button>
          <span className="font-mono text-[11px] text-dark tabular-nums w-5 text-center">{tickCount}</span>
          <button
            type="button"
            onClick={() => setTickCount((t) => Math.min(16, t + 1))}
            disabled={tickCount >= 16}
            className={STEP_BTN}
            aria-label="More gridlines"
          >
            +
          </button>
        </div>
      </div>

      {showEmpty ? (
        <div className="h-[320px] flex items-center justify-center">
          <p className="font-sans text-muted text-sm">
            Nothing to plot yet — add clients with a kickoff date, revenue, or expenses.
          </p>
        </div>
      ) : (
        <div style={{ cursor: "pointer" }}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 8 }}>
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
                domain={[0, yMax]}
                tickCount={tickCount}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: axis, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={compactInr}
                width={56}
              />
              <ZAxis range={[46, 46]} />

              <Tooltip content={renderTooltip as never} cursor={{ stroke: grid, strokeWidth: 1 }} />

              {visible.map((s) => (
                <Area
                  key={s.key}
                  type="linear"
                  dataKey={s.key}
                  name={s.name}
                  stackId="stack"
                  stroke={s.color}
                  strokeWidth={1.5}
                  fill={s.color}
                  fillOpacity={0.3}
                  dot={false}
                  activeDot={false}
                />
              ))}

              <Line
                type="linear"
                dataKey="_total"
                name="total"
                stroke={totalColor}
                strokeWidth={2}
                dot={false}
                legendType="none"
              />

              <Scatter
                data={dots}
                dataKey="y"
                legendType="none"
                onClick={(p) => {
                  const d = (p as unknown as { payload?: { key: string; x: number } }).payload;
                  if (d) setSelected({ key: d.key, x: d.x });
                }}
              >
                {dots.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {selected &&
        (() => {
          const s = series.find((x) => x.key === selected.key);
          const row = data.find((r) => r.x === selected.x);
          const items = details[`${selected.key}|${selected.x}`] ?? [];
          const total = items.reduce((t, it) => t + Number(it.amount || 0), 0);
          return (
            <div className="border border-dark/10 rounded-xl bg-white p-4 mt-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s?.color }} />
                <p className="font-serif text-base text-dark">
                  {s?.name} · {row ? String(row.label) : ""}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-auto text-muted hover:text-dark text-sm"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              {items.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-baseline gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-sans text-sm text-dark">{it.label}</span>
                        {it.date && (
                          <span className="font-mono text-[10px] text-muted uppercase tracking-widest ml-2">{it.date}</span>
                        )}
                      </div>
                      <span className="font-sans text-sm text-dark tabular-nums">{formatMoney(it.amount, "INR")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-sans text-sm text-muted">No line-items recorded for this entry.</p>
              )}
              <div className="flex items-baseline gap-3 mt-3 pt-3 border-t border-dark/10">
                <span className="font-mono text-[10px] text-muted uppercase tracking-widest flex-1">total</span>
                <span className="font-sans text-sm text-dark font-semibold tabular-nums">{formatMoney(total, "INR")}</span>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
