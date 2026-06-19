import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

export function isValidStripePublishableKey(key: string): boolean {
  return key.startsWith("pk_test_") || key.startsWith("pk_live_");
}

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = getStripePublishableKey();
    stripePromise =
      key && isValidStripePublishableKey(key)
        ? loadStripe(key)
        : Promise.resolve(null);
  }
  return stripePromise;
}
