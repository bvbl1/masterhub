package api

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/payment/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/payment/internal/ports"
	stripe "github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/paymentintent"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Application struct {
	db          ports.DBPort
	orderClient ports.OrderClientPort // gRPC клиент к order-service
}

func NewApplication(db ports.DBPort, orderClient ports.OrderClientPort, stripeSecretKey string) *Application {
	stripe.Key = stripeSecretKey
	return &Application{
		db:          db,
		orderClient: orderClient,
	}
}

// InitiatePayment создаёт PaymentIntent в Stripe.
// Сумму берём из order-service — никогда не доверяем клиенту.
func (a *Application) InitiatePayment(ctx context.Context, orderID int64) (clientSecret string, transactionID string, err error) {
	// Идемпотентность: если PaymentIntent уже создан — вернуть его.
	// Это защита от двойного нажатия кнопки "Оплатить" на фронте.
	existing, err := a.db.GetPaymentByOrderID(orderID)
	if err == nil && existing != nil {
		return existing.ClientSecret, existing.TransactionID, nil
	}

	// Получаем заказ из order-service чтобы узнать сумму и проверить статус.
	// Клиент не может подменить amount — он вообще его не передаёт.
	order, err := a.orderClient.GetOrder(ctx, orderID)
	if err != nil {
		return "", "", status.Errorf(codes.NotFound, "order %d not found: %v", orderID, err)
	}

	// Проверяем что заказ в правильном статусе — только pending_payment можно оплатить.
	if order.Status != "pending_payment" {
		return "", "", status.Errorf(
			codes.FailedPrecondition,
			"order %d has status %q, expected pending_payment",
			orderID, order.Status,
		)
	}

	// Создаём PaymentIntent в Stripe.
	// Amount — всегда в наименьших единицах: тиын для KZT, центы для USD.
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(order.AgreedPrice * 100)),
		Currency: stripe.String("kzt"),
		Metadata: map[string]string{
			// Сохраняем order_id в метаданных Stripe — достанем его в webhook.
			"order_id": fmt.Sprintf("%d", orderID),
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return "", "", status.Errorf(codes.Internal, "stripe: failed to create payment intent: %v", err)
	}

	// Сохраняем в БД со статусом "pending".
	p := &domain.Payment{
		OrderID:       orderID,
		Amount:        order.AgreedPrice,
		Status:        "pending",
		TransactionID: pi.ID,           // pi_3abc...
		ClientSecret:  pi.ClientSecret, // pi_3abc..._secret_xyz — нужен Stripe.js на фронте
	}
	if err := a.db.CreatePayment(p); err != nil {
		return "", "", status.Errorf(codes.Internal, "db: failed to save payment: %v", err)
	}

	return pi.ClientSecret, pi.ID, nil
}

// ConfirmPayment вызывается из webhook-обработчика когда Stripe прислал
// событие payment_intent.succeeded. Обновляет статус платежа и переводит
// заказ в in_progress через order-service.
func (a *Application) ConfirmPayment(ctx context.Context, stripePaymentIntentID string) (orderID int64, err error) {
	// Находим наш платёж по Stripe PaymentIntent ID.
	p, err := a.db.GetPaymentByTransactionID(stripePaymentIntentID)
	if err != nil {
		return 0, status.Errorf(codes.NotFound, "payment not found for transaction %s", stripePaymentIntentID)
	}

	// Идемпотентность: если уже paid — не трогаем, просто возвращаем order_id.
	// Stripe может прислать один webhook несколько раз — это нормально.
	if p.Status == "paid" {
		return p.OrderID, nil
	}

	// Обновляем статус платежа в нашей БД.
	if err := a.db.UpdatePaymentStatusByTransactionID(stripePaymentIntentID, "paid"); err != nil {
		return 0, status.Errorf(codes.Internal, "db: failed to update payment status: %v", err)
	}

	// Переводим заказ в in_progress через order-service.
	// Это основное действие — именно после этого провайдер увидит подтверждение.
	if err := a.orderClient.UpdateOrderStatus(ctx, p.OrderID, "in_progress"); err != nil {
		// Не возвращаем ошибку клиенту — Stripe уже получит 200 OK.
		// Логируем для ручного расследования. В продакшне здесь был бы retry.
		fmt.Printf("ERROR: payment confirmed but order %d status update failed: %v\n", p.OrderID, err)
	}

	return p.OrderID, nil
}

// GetPayment возвращает текущее состояние платежа по order_id.
func (a *Application) GetPayment(ctx context.Context, orderID int64) (*domain.Payment, error) {
	p, err := a.db.GetPaymentByOrderID(orderID)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "payment not found for order %d", orderID)
	}
	return p, nil
}

// UpdatePaymentStatusFailed вызывается из webhook при payment_intent.payment_failed.
// Помечаем платёж как failed — фронт покажет пользователю ошибку оплаты.
func (a *Application) UpdatePaymentStatusFailed(ctx context.Context, stripePaymentIntentID string) error {
	if err := a.db.UpdatePaymentStatusByTransactionID(stripePaymentIntentID, "failed"); err != nil {
		return fmt.Errorf("db: failed to mark payment as failed: %w", err)
	}
	return nil
}
