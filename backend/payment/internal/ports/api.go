package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/payment/internal/application/core/domain"
)

type APIPort interface {
	// InitiatePayment создаёт PaymentIntent в Stripe.
	// Возвращает client_secret (для Stripe.js) и transaction_id (pi_xxx).
	InitiatePayment(ctx context.Context, orderID int64) (clientSecret string, transactionID string, err error)

	// ConfirmPayment вызывается из webhook когда Stripe подтвердил оплату.
	// Возвращает order_id чтобы webhook мог дёрнуть order-service.
	ConfirmPayment(ctx context.Context, stripePaymentIntentID string) (orderID int64, err error)

	// GetPayment возвращает текущее состояние платежа по order_id.
	GetPayment(ctx context.Context, orderID int64) (*domain.Payment, error)
	UpdatePaymentStatusFailed(ctx context.Context, stripePaymentIntentID string) error
}
