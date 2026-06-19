package ports

import "github.com/Rask1lll/masterhub/backend/payment/internal/application/core/domain"

type DBPort interface {
	CreatePayment(p *domain.Payment) error
	GetPaymentByOrderID(orderID int64) (*domain.Payment, error)
	UpdatePaymentStatusByTransactionID(transactionID string, status string) error

	GetPaymentByTransactionID(transactionID string) (*domain.Payment, error)
}
