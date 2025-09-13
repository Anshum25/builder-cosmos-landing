import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { useTheme } from "@/hooks/useTheme";

export default function ExpensePie({ data, id }: { data: { name: string; value: number }[]; id?: string }) {
  const { isDark } = useTheme();
  const COLORS = isDark
    ? ["#A78BFA", "#F472B6", "#22D3EE", "#F59E0B", "#60A5FA"]
    : ["#6366F1", "#A78BFA", "#F472B6", "#06B6D4", "#F59E0B"];
  return (
    <div id={id} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <RTooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
