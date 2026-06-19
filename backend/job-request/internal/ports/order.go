package ports

import "context"

// CreateOrderRequest holds everything job-request-service needs to pass
// to order-service when a customer accepts a provider's bid.
//
// NOTE: order-service.CreateOrder extracts customer_id from the JWT context
// automatically — so we do NOT include it here. The job-request adapter must
// forward the original customer request context when calling order-service,
// so the customer's token is present in the outgoing gRPC metadata.
//
// ServiceID is 0 for Flow 2 (job-request flow) since the customer picked a
// provider from bids, not a specific service listing. The order-service grpc
// handler receives 0 for service_id in this case — see note in adapter below.
type CreateOrderRequest struct {
	ServiceID   int64 // 0 for Flow 2; order-service skips service validation if 0
	ProviderID  int64 // the provider whose bid was accepted
	Street      string
	City        string
	Region      string
	Latitude    float64
	Longitude   float64
	ScheduledAt string // RFC3339
	AgreedPrice float64
}

type CreateOrderResponse struct {
	OrderID int64
}

// OrderPort is the outbound port for communicating with order-service.
// The gRPC client adapter in adapters/grpc/order.go implements this.
type OrderPort interface {
	CreateOrder(ctx context.Context, req CreateOrderRequest) (CreateOrderResponse, error)
}
