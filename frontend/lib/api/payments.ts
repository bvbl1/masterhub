import { get, post } from "./client";
import type { PayOrderResponse, PaymentStatusResponse } from "./types";

function parseClientSecret(raw: PayOrderResponse): string {
  const secret = raw.client_secret ?? raw.clientSecret;
  if (!secret?.trim()) {
    throw new Error("Missing client_secret from pay response");
  }
  return secret.trim();
}

/** Creates a Stripe PaymentIntent; order status updates via webhook only. */
export function initiateOrderPayment(
  orderId: number,
): Promise<{ clientSecret: string }> {
  return post<PayOrderResponse>(`/orders/${orderId}/pay`, undefined, {
    auth: true,
  }).then((raw) => ({ clientSecret: parseClientSecret(raw) }));
}

/** @deprecated Use initiateOrderPayment */
export function createPayment(
  orderId: number,
): Promise<{ clientSecret: string }> {
  return initiateOrderPayment(orderId);
}

export function getPaymentStatus(
  orderId: number,
): Promise<PaymentStatusResponse> {
  return get<PaymentStatusResponse>(`/payments/${orderId}`, { auth: true });
}
