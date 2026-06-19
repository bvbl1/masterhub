"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { useModalStore } from "@/lib/store/modalStore";
import type { Order } from "@/lib/api";
import { ordersApi, paymentsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";
import {
  getStripe,
  getStripePublishableKey,
  isValidStripePublishableKey,
} from "@/lib/stripe";

const POLL_INTERVAL_MS = 200;
const POLL_MAX_ATTEMPTS = 15;

const cardElementOptions: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1f2937",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#dc2626" },
  },
};

type OrderPaymentModalProps = {
  order: Order;
  orderTitle: string;
  onSuccess?: () => void | Promise<void>;
};

type Phase = "loading" | "form" | "success" | "error";

async function pollOrderAfterPayment(orderId: number): Promise<boolean> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const o = await ordersApi.getOrder(orderId);
    if (o.status !== "pending_payment") return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

function StripeCardForm({
  clientSecret,
  onPaid,
  onError,
}: {
  clientSecret: string;
  onPaid: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useOrdersTranslation();
  const { closeModal } = useModalStore();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  if (!stripe || !elements) {
    return (
      <p className="text-sm text-gray-600 py-2">{t("payment.preparing")}</p>
    );
  }

  const handlePay = async () => {
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      onError(t("payment.errCardMissing"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumber },
      });

      if (result.error) {
        onError(result.error.message ?? t("payment.errPaymentFailed"));
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        onPaid();
        return;
      }

      onError(t("payment.errPaymentFailed"));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("payment.errPaymentFailed");
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            {t("payment.cardNumber")}
          </label>
          <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-3 min-h-[44px]">
            <CardNumberElement options={cardElementOptions} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {t("payment.cardExpiry")}
            </label>
            <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-3 min-h-[44px]">
              <CardExpiryElement options={cardElementOptions} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {t("payment.cardCvc")}
            </label>
            <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-3 min-h-[44px]">
              <CardCvcElement options={cardElementOptions} />
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">{t("payment.testCardHint")}</p>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={closeModal}
          className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {t("payment.cancel")}
        </button>
        <button
          type="button"
          disabled={!stripe || !elements || submitting}
          onClick={() => void handlePay()}
          className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-[#486284] hover:bg-[#3a5270] rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? t("payment.processing") : t("payment.pay")}
        </button>
      </div>
    </>
  );
}

export default function OrderPaymentModal({
  order,
  orderTitle,
  onSuccess,
}: OrderPaymentModalProps) {
  const { t } = useOrdersTranslation();
  const { closeModal } = useModalStore();
  const [phase, setPhase] = useState<Phase>("loading");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusSynced, setStatusSynced] = useState(false);

  const finishSuccess = useCallback(async () => {
    setPhase("success");
    const synced = await pollOrderAfterPayment(order.id);
    setStatusSynced(synced);
    await onSuccess?.();
  }, [order.id, onSuccess]);

  const stripeKey = getStripePublishableKey();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!stripeKey) {
        if (!cancelled) {
          setErrorMessage(t("payment.errStripeNotConfigured"));
          setPhase("error");
        }
        return;
      }
      if (!isValidStripePublishableKey(stripeKey)) {
        if (!cancelled) {
          setErrorMessage(t("payment.errStripeInvalidKey"));
          setPhase("error");
        }
        return;
      }

      try {
        const { clientSecret: secret } = await paymentsApi.initiateOrderPayment(
          order.id,
        );
        if (cancelled) return;
        setClientSecret(secret);
        setPhase("form");
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : t("payment.errInitFailed");
        setErrorMessage(msg);
        setPhase("error");
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [order.id, t]);

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[92vw] max-h-[90vh] overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-[#486284] to-[#3a5270] px-6 pt-6 pb-5 shrink-0">
        <h2 className="text-xl font-bold text-white">{t("payment.title")}</h2>
        <p className="text-sm text-white/75 mt-1 line-clamp-2">{orderTitle}</p>
        <p className="text-lg font-semibold text-white mt-3 tabular-nums">
          {formatCurrency(order.agreed_price, { decimals: 2 })}
        </p>
      </div>

      <div className="px-6 py-5 overflow-y-auto">
        {phase === "loading" && (
          <p className="text-sm text-gray-600">{t("payment.preparing")}</p>
        )}

        {phase === "form" && clientSecret && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("payment.intro")}
            </p>
            <Elements stripe={getStripe()}>
              <StripeCardForm
                clientSecret={clientSecret}
                onPaid={() => void finishSuccess()}
                onError={(msg) => setErrorMessage(msg)}
              />
            </Elements>
            {errorMessage ? (
              <p className="text-xs text-red-600">{errorMessage}</p>
            ) : null}
          </div>
        )}

        {phase === "success" && (
          <div className="space-y-3 text-center py-2">
            <p className="text-base font-semibold text-gray-900">
              {t("payment.successTitle")}
            </p>
            <p className="text-sm text-gray-600">{t("payment.successBody")}</p>
            {!statusSynced ? (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                {t("payment.successPendingSync")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={closeModal}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#486284] hover:bg-[#3a5270] rounded-lg transition-colors mt-2"
            >
              {t("payment.done")}
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-red-600">
              {errorMessage ?? t("payment.errInitFailed")}
            </p>
            <button
              type="button"
              onClick={closeModal}
              className="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t("payment.cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
