import { useId } from "react";

const GOLD = "#FACC15";
const GRAY = "#D1D5DB";

export default function StarIcon({
  notActive = false,
  fillPercent,
}: {
  notActive?: boolean;
  fillPercent?: number;
}) {
  const reactId = useId();
  const gradientId = `star-fill-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const pct = notActive
    ? 0
    : fillPercent === undefined
      ? 100
      : Math.min(100, Math.max(0, fillPercent));

  const pathD =
    "M5.70654 0L7.05363 4.1459H11.4129L7.88617 6.7082L9.23325 10.8541L5.70654 8.2918L2.17983 10.8541L3.52692 6.7082L0.000204086 4.1459H4.35946L5.70654 0Z";

  if (pct >= 100) {
    return (
      <svg
        width="12"
        height="11"
        viewBox="0 0 12 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={pathD} fill={GOLD} />
      </svg>
    );
  }

  if (pct <= 0) {
    return (
      <svg
        width="12"
        height="11"
        viewBox="0 0 12 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={pathD} fill={GRAY} />
      </svg>
    );
  }

  return (
    <svg
      width="12"
      height="11"
      viewBox="0 0 12 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor={GOLD} />
          <stop offset={`${pct}%`} stopColor={GOLD} />
          <stop offset={`${pct}%`} stopColor={GRAY} />
          <stop offset="100%" stopColor={GRAY} />
        </linearGradient>
      </defs>
      <path d={pathD} fill={`url(#${gradientId})`} />
    </svg>
  );
}
