"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { formatMoney } from "@/lib/hq";

const PIE_COLORS = [
  "#E8533A",
  "#0D0D0D",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
];

function compactInr(n: number): string {
  const v = Number(n || 0);
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(0)}k`;
  return `₹${Math.round(v)}`;
}

const tick = { fontSize: 11, fill: "#999999" };

export function MoneyBar({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <XAxis dataKey="name" tick={tick} axisLine={{ stroke: "#e5e5e5" }} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={compactInr} width={56} />
        <Tooltip
          cursor={{ fill: "rgba(13,13,13,0.04)" }}
          formatter={((value: number) => [formatMoney(value, "INR"), ""]) as never}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(13,13,13,0.1)",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
          labelStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#999999" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={((value: number, name: string) => [formatMoney(value, "INR"), name]) as never}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(13,13,13,0.1)",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          iconType="circle"
          wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
