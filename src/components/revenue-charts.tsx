"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

const COLORS = ["#FFC857", "#2ED9A3", "#6C7BFF", "#FF6B35", "#E9EBE8", "#D6FF2C", "#FF4D3D", "#38BDF8"];
const AXIS_COLOR = "#9AA0A0";
const GRID_COLOR = "#2A3136";
const TOOLTIP_STYLE = { backgroundColor: "#14181B", border: "1px solid #2A3136", borderRadius: "10px", color: "#FFFFFF" };

export function MonthlyBar({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={{ stroke: AXIS_COLOR }} tickLine={{ stroke: AXIS_COLOR }} />
        <YAxis tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={{ stroke: AXIS_COLOR }} tickLine={{ stroke: AXIS_COLOR }} tickFormatter={(v: any) => `₹${v}`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
        <Bar dataKey="revenue" fill="#FFC857" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MethodPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DailyLine({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={{ stroke: AXIS_COLOR }} tickLine={{ stroke: AXIS_COLOR }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={{ stroke: AXIS_COLOR }} tickLine={{ stroke: AXIS_COLOR }} tickFormatter={(v: any) => `₹${v}`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
        <Line type="monotone" dataKey="revenue" stroke="#2ED9A3" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
