import { get, post, del } from "./client";
import { collectPhotoUrls } from "./photoUrls";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderStatus,
  RejectOrderRequest,
  OrderStatusResponse,
  DisputeOrderRequest,
  ResolveDisputeRequest,
  DisputedOrderListEntry,
} from "./types";

/** Raw order object from gRPC-Gateway (camelCase + int64 as strings). */
type OrderApiJson = {
  id?: string | number;
  customerId?: string | number;
  providerId?: string | number;
  serviceId?: string | number;
  addressId?: string | number;
  scheduledAt?: string;
  agreedPrice?: number;
  status?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  photoUrls?: string[];
  photo_urls?: string[];
  // snake_case fallbacks
  customer_id?: string | number;
  provider_id?: string | number;
  service_id?: string | number;
  address_id?: string | number;
  scheduled_at?: string;
  agreed_price?: number;
};

function normalizeOrder(raw: OrderApiJson): Order {
  const customerId = raw.customerId ?? raw.customer_id;
  const providerId = raw.providerId ?? raw.provider_id;
  const serviceId = raw.serviceId ?? raw.service_id;
  const addressId = raw.addressId ?? raw.address_id;
  const scheduledAt = raw.scheduledAt ?? raw.scheduled_at ?? "";
  const agreedPrice = raw.agreedPrice ?? raw.agreed_price ?? 0;

  return {
    id: Number(raw.id),
    customer_id: Number(customerId),
    provider_id: Number(providerId),
    service_id: Number(serviceId),
    address_id: Number(addressId),
    scheduled_at: scheduledAt,
    agreed_price: Number(agreedPrice),
    status: raw.status as OrderStatus,
    photoUrls: collectPhotoUrls(raw as Record<string, unknown>),
  };
}

export function createOrder(
  data: CreateOrderRequest
): Promise<CreateOrderResponse> {
  return post<unknown>("/orders", data, { auth: true }).then((raw) => {
    const body = raw as {
      order?: { id?: number | string };
      id?: number | string;
    };
    const id = body.order?.id ?? body.id;
    if (id === undefined || id === null) {
      throw new Error("Invalid create order response: missing id");
    }
    return {
      id: Number(id),
      status: "pending_provider_acceptance" as const,
    };
  });
}

export function getOrders(): Promise<Order[]> {
  return get<unknown>("/orders", { auth: true }).then((raw) => {
    if (Array.isArray(raw)) {
      return (raw as OrderApiJson[]).map(normalizeOrder);
    }
    const body = raw as { orders?: OrderApiJson[] };
    if (!body.orders || !Array.isArray(body.orders)) {
      return [];
    }
    return body.orders.map(normalizeOrder);
  });
}

export function getOrder(id: number): Promise<Order> {
  return get<unknown>(`/orders/${id}`, { auth: true }).then((raw) => {
    const body = raw as { order?: OrderApiJson };
    const o = body.order ?? (raw as OrderApiJson);
    if (o == null || o.id === undefined || o.id === null) {
      throw new Error("Invalid get order response");
    }
    return normalizeOrder(o);
  });
}

export function acceptOrder(id: number): Promise<OrderStatusResponse> {
  return post<OrderStatusResponse>(`/orders/${id}/accept`, undefined, {
    auth: true,
  });
}

export function rejectOrder(
  id: number,
  data: RejectOrderRequest
): Promise<OrderStatusResponse> {
  return post<OrderStatusResponse>(`/orders/${id}/reject`, data, {
    auth: true,
  });
}

export function cancelOrder(id: number): Promise<OrderStatusResponse> {
  return del<OrderStatusResponse>(`/orders/${id}`, { auth: true });
}

export function completeOrder(id: number): Promise<OrderStatusResponse> {
  return post<OrderStatusResponse>(`/orders/${id}/complete`, undefined, {
    auth: true,
  });
}

export function confirmOrder(id: number): Promise<OrderStatusResponse> {
  return post<OrderStatusResponse>(`/orders/${id}/confirm`, undefined, {
    auth: true,
  });
}

export function disputeOrder(
  id: number,
  data: DisputeOrderRequest,
): Promise<OrderStatusResponse> {
  const body: Record<string, unknown> = { reason: data.reason };
  if (data.photo_urls?.length) {
    body.photo_urls = data.photo_urls;
  }
  return post<OrderStatusResponse>(`/orders/${id}/dispute`, body, {
    auth: true,
  });
}

type DisputeListRowJson = {
  id?: string | number;
  orderId?: string | number;
  order_id?: string | number;
  order?: OrderApiJson;
  disputeReason?: string;
  dispute_reason?: string;
  raisedBy?: string | number;
  raised_by?: string | number;
  createdAt?: string;
  created_at?: string;
  photoUrls?: string[];
  photo_urls?: string[];
};

function parseDisputedOrderList(raw: unknown): DisputedOrderListEntry[] {
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (
      first &&
      typeof first === "object" &&
      "order" in (first as object) &&
      (first as DisputeListRowJson).order
    ) {
      return parseDisputeRows(raw as DisputeListRowJson[]);
    }
    return (raw as OrderApiJson[]).map((o) => {
      const order = normalizeOrder(o);
      return {
        disputeId: order.id,
        orderId: order.id,
        order,
        disputeReason: "",
        raisedBy: 0,
        createdAt: undefined,
      };
    });
  }

  if (!raw || typeof raw !== "object") return [];

  const body = raw as Record<string, unknown>;
  const nested = body.data;
  const fromData =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>).disputes
      : undefined;

  const rows =
    (Array.isArray(body.disputes) ? body.disputes : undefined) ??
    (Array.isArray(fromData) ? fromData : undefined) ??
    (Array.isArray(body.orders) ? body.orders : undefined);

  if (!rows || !Array.isArray(rows)) {
    return [];
  }

  const first = rows[0];
  if (
    first &&
    typeof first === "object" &&
    "order" in (first as object) &&
    (first as DisputeListRowJson).order
  ) {
    return parseDisputeRows(rows as DisputeListRowJson[]);
  }

  return (rows as OrderApiJson[]).map((o) => {
    const order = normalizeOrder(o);
    return {
      disputeId: order.id,
      orderId: order.id,
      order,
      disputeReason: "",
      raisedBy: 0,
      createdAt: undefined,
    };
  });
}

function parseDisputeRows(rows: DisputeListRowJson[]): DisputedOrderListEntry[] {
  const out: DisputedOrderListEntry[] = [];
  for (const r of rows) {
    const orderRaw = r.order;
    if (!orderRaw || orderRaw.id === undefined || orderRaw.id === null) {
      continue;
    }
    const order = normalizeOrder(orderRaw);
    const disputeReason = String(
      r.disputeReason ?? r.dispute_reason ?? "",
    ).trim();
    const raised = Number(r.raisedBy ?? r.raised_by);
    const disputeId = Number(r.id);
    const orderIdFromRow = Number(r.orderId ?? r.order_id);
    const disputePhotos = collectPhotoUrls(r as Record<string, unknown>);
    const orderPhotos = order.photoUrls ?? [];
    const photoUrls =
      disputePhotos.length > 0 ? disputePhotos : orderPhotos;

    out.push({
      disputeId: Number.isFinite(disputeId) ? disputeId : order.id,
      orderId: Number.isFinite(orderIdFromRow) ? orderIdFromRow : order.id,
      order,
      disputeReason,
      raisedBy: Number.isFinite(raised) ? raised : 0,
      createdAt: String(r.createdAt ?? r.created_at ?? "") || undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
    });
  }
  return out;
}

/** GET /admin/orders/disputed — список споров (только admin). */
export function listDisputedOrders(): Promise<DisputedOrderListEntry[]> {
  return get<unknown>("/admin/orders/disputed", { auth: true }).then(
    parseDisputedOrderList,
  );
}

/** POST /admin/orders/:id/resolve — разрешение спора (только admin). */
export function resolveDisputedOrder(
  id: number,
  data: ResolveDisputeRequest,
): Promise<OrderStatusResponse> {
  return post<OrderStatusResponse>(`/admin/orders/${id}/resolve`, data, {
    auth: true,
  });
}
