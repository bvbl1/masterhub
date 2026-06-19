package ports

import "context"

type PaymentPort interface {
	// InitiatePayment creates PaymentIntent in the Stripe.
	// returns client_secret for Stripe.js in the front.
	// status of order is changed in webhook.
	InitiatePayment(ctx context.Context, orderID int64) (clientSecret string, err error)
}
