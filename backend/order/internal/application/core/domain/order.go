package domain

import "time"

type OrderStatus string

const (
	StatusPendingProviderAcceptance   OrderStatus = "pending_provider_acceptance"
	StatusPendingPayment              OrderStatus = "pending_payment"
	StatusRejectedByProvider          OrderStatus = "rejected_by_provider"
	StatusCancelled                   OrderStatus = "cancelled"
	StatusInProgress                  OrderStatus = "in_progress"
	StatusPendingCustomerConfirmation OrderStatus = "pending_customer_confirmation"
	StatusCompleted                   OrderStatus = "completed"
	StatusDisputed                    OrderStatus = "disputed"
	StatusReviewed                    OrderStatus = "reviewed"
)

type Order struct {
	ID              int64       `json:"id"`
	CustomerID      int64       `json:"customer_id"`
	ProviderID      int64       `json:"provider_id"`
	ServiceID       int64       `json:"service_id"`
	AddressID       int64       `json:"address_id"`
	ScheduledAt     time.Time   `json:"scheduled_at"`
	AgreedPrice     float64     `json:"agreed_price"`
	Status          OrderStatus `json:"status"`
	RejectionReason string      `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
	PhotoUrls       []string    `json:"photo_urls,omitempty"`
}

// ValidTransitions defines allowed status transitions
var ValidTransitions = map[OrderStatus][]OrderStatus{
	StatusPendingProviderAcceptance:   {StatusPendingPayment, StatusRejectedByProvider, StatusCancelled},
	StatusPendingPayment:              {StatusInProgress, StatusCancelled},
	StatusInProgress:                  {StatusPendingCustomerConfirmation, StatusDisputed},
	StatusPendingCustomerConfirmation: {StatusCompleted, StatusDisputed},
	StatusDisputed:                    {StatusCompleted, StatusCancelled},
	StatusReviewed:                    {StatusCompleted, StatusCancelled},
}

func (o *Order) CanTransitionTo(next OrderStatus) bool {
	allowed, ok := ValidTransitions[o.Status]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == next {
			return true
		}
	}
	return false
}
