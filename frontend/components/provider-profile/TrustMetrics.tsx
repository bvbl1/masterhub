"use client";

import { useProviderTranslation } from "@/lib/i18n/useProviderTranslation";

interface TrustMetricsProps {
  responseRate: number;
  completedJobs: number;
  memberSince: number;
}

function formatJobs(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`;
  return `${count}+`;
}

export default function TrustMetrics({
  responseRate,
  completedJobs,
  memberSince,
}: TrustMetricsProps) {
  const { t } = useProviderTranslation();

  const metrics = [
    {
      labelKey: "trust.responseRate" as const,
      value: `${responseRate}%`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M18.333 9.233V10a8.333 8.333 0 11-4.941-7.617"
            stroke="#22C55E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.333 3.333L10 11.675l-2.5-2.5"
            stroke="#22C55E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      labelKey: "trust.completedJobs" as const,
      value: formatJobs(completedJobs),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect
            x="2.5"
            y="3.333"
            width="15"
            height="13.334"
            rx="2"
            stroke="#486284"
            strokeWidth="1.5"
          />
          <path
            d="M7.5 1.667v3.333M12.5 1.667v3.333M2.5 8.333h15"
            stroke="#486284"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      labelKey: "trust.memberSince" as const,
      value: String(memberSince),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="8.333"
            stroke="#8B5CF6"
            strokeWidth="1.5"
          />
          <path
            d="M10 5v5l3.333 1.667"
            stroke="#8B5CF6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6 -mt-1">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.labelKey}
            className="flex items-center gap-3.5 bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
              {metric.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-xs text-gray-400 font-medium">
                {t(metric.labelKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
