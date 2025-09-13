import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { useTheme } from "@/hooks/useTheme";

export default function SavingsLine({ data, id }: { data: { label: string; savings: number }[]; id?: string }) {
  const { isDark } = useTheme();
  const stroke = isDark ? "#A78BFA" : "#6366F1";
  return (
    <div id={id} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="label" hide={false} stroke={isDark ? "#CBD5E1" : "#64748B"} />
          <YAxis hide={false} stroke={isDark ? "#CBD5E1" : "#64748B"} />
          <RTooltip />
          <Line type="monotone" dataKey="savings" stroke={stroke} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
