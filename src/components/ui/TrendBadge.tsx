import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  value: number;
  suffix?: string;
}

export default function TrendBadge({ value, suffix = "%" }: TrendBadgeProps) {
  if (value > 2) {
    return (
      <span className="pa-trend up">
        <TrendingUp size={11} />
        +{value}{suffix}
      </span>
    );
  }
  if (value < -2) {
    return (
      <span className="pa-trend down">
        <TrendingDown size={11} />
        {value}{suffix}
      </span>
    );
  }
  return (
    <span className="pa-trend mid">
      <Minus size={11} />
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
}
