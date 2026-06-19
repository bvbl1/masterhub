package grpc

import (
	"context"
	"time"

	"github.com/Rask1lll/masterhub/backend/payment/internal/ports"
	paymentpb "github.com/bvbl1/masterhub-proto/golang/payment"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GRPCServer struct {
	paymentpb.UnimplementedPaymentServiceServer
	api ports.APIPort
}

func NewGRPCServer(api ports.APIPort) *GRPCServer {
	return &GRPCServer{api: api}
}

// InitiatePayment вызывается фронтом через gateway.
// Создаёт PaymentIntent в Stripe, возвращает client_secret для Stripe.js.
// Сумму берём из order-service — клиенту НЕ доверяем.
func (s *GRPCServer) InitiatePayment(ctx context.Context, req *paymentpb.InitiatePaymentRequest) (*paymentpb.InitiatePaymentResponse, error) {
	if req.OrderId == 0 {
		return nil, status.Error(codes.InvalidArgument, "order_id is required")
	}

	clientSecret, txID, err := s.api.InitiatePayment(ctx, req.OrderId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to initiate payment: %v", err)
	}

	return &paymentpb.InitiatePaymentResponse{
		ClientSecret:  clientSecret,
		TransactionId: txID,
		Status:        "pending",
	}, nil
}

// ConfirmPayment вызывается ТОЛЬКО внутри payment-service из webhook HTTP-обработчика.
// Stripe прислал событие payment_intent.succeeded — обновляем статус и дёргаем order-service.
// Наружу через gateway НЕ выставляется (нет http annotation в proto).
func (s *GRPCServer) ConfirmPayment(ctx context.Context, req *paymentpb.ConfirmPaymentRequest) (*paymentpb.ConfirmPaymentResponse, error) {
	if req.StripePaymentIntentId == "" {
		return nil, status.Error(codes.InvalidArgument, "stripe_payment_intent_id is required")
	}

	orderID, err := s.api.ConfirmPayment(ctx, req.StripePaymentIntentId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to confirm payment: %v", err)
	}

	return &paymentpb.ConfirmPaymentResponse{
		Success: true,
		OrderId: orderID,
	}, nil
}

// GetPayment вызывается фронтом для отображения статуса оплаты на странице заказа.
func (s *GRPCServer) GetPayment(ctx context.Context, req *paymentpb.GetPaymentRequest) (*paymentpb.GetPaymentResponse, error) {
	if req.OrderId == 0 {
		return nil, status.Error(codes.InvalidArgument, "order_id is required")
	}

	p, err := s.api.GetPayment(ctx, req.OrderId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "payment not found for order %d", req.OrderId)
	}

	return &paymentpb.GetPaymentResponse{
		Payment: &paymentpb.Payment{
			Id:            p.ID,
			OrderId:       p.OrderID,
			Amount:        p.Amount,
			Status:        p.Status,
			TransactionId: p.TransactionID,
			ClientSecret:  p.ClientSecret,
			CreatedAt:     p.CreatedAt.Format(time.RFC3339),
			UpdatedAt:     p.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}
