import { get } from "./client";

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  ordersThisMonth: number;
  byStatus: OrderStatusCount[];
  totalRevenue: number;
  revenueThisMonth: number;
  avgOrderValue: number;
  completionRate: number;
}

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseByStatus(raw: unknown): OrderStatusCount[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      status: String(o.status ?? ""),
      count: toNum(o.count ?? o.Count),
    };
  });
}

function parseAnalytics(data: unknown): OrderAnalytics {
  const o = (data ?? {}) as Record<string, unknown>;
  return {
    totalOrders: toNum(o.totalOrders ?? o.total_orders),
    ordersThisMonth: toNum(o.ordersThisMonth ?? o.orders_this_month),
    byStatus: parseByStatus(o.byStatus ?? o.by_status),
    totalRevenue: toNum(o.totalRevenue ?? o.total_revenue),
    revenueThisMonth: toNum(o.revenueThisMonth ?? o.revenue_this_month),
    avgOrderValue: toNum(o.avgOrderValue ?? o.avg_order_value),
    completionRate: toNum(o.completionRate ?? o.completion_rate),
  };
}

/** GET /v1/admin/orders/analytics — admin only */
export function getOrderAnalytics(): Promise<OrderAnalytics> {
  return get<unknown>("/admin/orders/analytics", { auth: true }).then(
    parseAnalytics,
  );
}
