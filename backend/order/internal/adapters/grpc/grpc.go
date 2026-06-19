package grpc

import (
	"context"
	"time"

	"github.com/Rask1lll/masterhub/backend/order/internal/application/core/domain"
	orderpb "github.com/bvbl1/masterhub-proto/golang/order"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) CreateOrder(ctx context.Context, req *orderpb.CreateOrderRequest) (*orderpb.CreateOrderResponse, error) {
	customerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user_id not found in context")
	}

	scheduledAt, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "scheduled_at must be a valid RFC3339 timestamp")
	}

	domainOrder := domain.Order{
		CustomerID:  customerID,
		ServiceID:   req.ServiceId,
		ProviderID:  req.ProviderId,
		ScheduledAt: scheduledAt,
		AgreedPrice: req.AgreedPrice,
		PhotoUrls:   req.PhotoUrls,
	}

	created, err := a.api.CreateOrder(ctx, domainOrder, req.Street, req.City, req.Region, req.Latitude, req.Longitude)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &orderpb.CreateOrderResponse{
		Order: toProtoOrder(created),
	}, nil
}

func (a *Adapter) GetOrder(ctx context.Context, req *orderpb.GetOrderRequest) (*orderpb.GetOrderResponse, error) {
	order, err := a.api.GetOrder(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.GetOrderResponse{Order: toProtoOrder(order)}, nil
}

func (a *Adapter) ListOrders(ctx context.Context, req *orderpb.ListOrdersRequest) (*orderpb.ListOrdersResponse, error) {
	orders, err := a.api.ListOrders(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	protoOrders := make([]*orderpb.Order, len(orders))
	for i, o := range orders {
		protoOrders[i] = toProtoOrder(o)
	}

	return &orderpb.ListOrdersResponse{Orders: protoOrders}, nil
}

func (a *Adapter) AcceptOrder(ctx context.Context, req *orderpb.AcceptOrderRequest) (*orderpb.AcceptOrderResponse, error) {
	updated, err := a.api.AcceptOrder(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.AcceptOrderResponse{Order: toProtoOrder(updated)}, nil
}

func (a *Adapter) RejectOrder(ctx context.Context, req *orderpb.RejectOrderRequest) (*orderpb.RejectOrderResponse, error) {
	updated, err := a.api.RejectOrder(ctx, req.Id, req.RejectionReason)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.RejectOrderResponse{Order: toProtoOrder(updated)}, nil
}

func (a *Adapter) CancelOrder(ctx context.Context, req *orderpb.CancelOrderRequest) (*orderpb.CancelOrderResponse, error) {
	err := a.api.CancelOrder(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.CancelOrderResponse{Success: true}, nil
}

func (a *Adapter) PayOrder(ctx context.Context, req *orderpb.PayOrderRequest) (*orderpb.PayOrderResponse, error) {
	clientSecret, err := a.api.PayOrder(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "pay order failed: %v", err)
	}
	return &orderpb.PayOrderResponse{
		ClientSecret: clientSecret,
	}, nil
}

func (a *Adapter) MarkComplete(ctx context.Context, req *orderpb.MarkCompleteRequest) (*orderpb.MarkCompleteResponse, error) {
	updated, err := a.api.MarkComplete(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.MarkCompleteResponse{Order: toProtoOrder(updated)}, nil
}

func (a *Adapter) ConfirmComplete(ctx context.Context, req *orderpb.ConfirmCompleteRequest) (*orderpb.ConfirmCompleteResponse, error) {
	updated, err := a.api.ConfirmComplete(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.ConfirmCompleteResponse{Order: toProtoOrder(updated)}, nil
}

func (a *Adapter) DisputeOrder(ctx context.Context, req *orderpb.DisputeOrderRequest) (*orderpb.DisputeOrderResponse, error) {
	updated, err := a.api.DisputeOrder(ctx, req.Id, req.Reason, req.PhotoUrls)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.DisputeOrderResponse{Order: toProtoOrder(updated)}, nil
}

func (a *Adapter) UpdateOrderStatus(ctx context.Context, req *orderpb.UpdateOrderStatusRequest) (*orderpb.UpdateOrderStatusResponse, error) {
	updated, err := a.api.UpdateOrderStatus(ctx, req.OrderId, domain.OrderStatus(req.Status))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &orderpb.UpdateOrderStatusResponse{Order: toProtoOrder(updated)}, nil
}

func (a *Adapter) ListDisputedOrders(ctx context.Context, req *orderpb.ListDisputedOrdersRequest) (*orderpb.ListDisputedOrdersResponse, error) {
	disputes, err := a.api.ListDisputedOrders(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	protoDisputes := make([]*orderpb.DisputedOrderProto, len(disputes))
	for i, d := range disputes {
		protoDisputes[i] = toProtoDisputedOrder(d)
	}

	return &orderpb.ListDisputedOrdersResponse{Disputes: protoDisputes}, nil
}

func (a *Adapter) ResolveDispute(ctx context.Context, req *orderpb.ResolveDisputeRequest) (*orderpb.ResolveDisputeResponse, error) {
	resolution := domain.OrderStatus(req.Resolution)

	updated, err := a.api.ResolveDispute(ctx, req.OrderId, resolution)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &orderpb.ResolveDisputeResponse{Order: toProtoOrder(updated)}, nil
}

func (a *Adapter) GetAnalytics(ctx context.Context, req *orderpb.GetAnalyticsRequest) (*orderpb.GetAnalyticsResponse, error) {
	data, err := a.api.GetAnalytics(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get analytics: %v", err)
	}

	byStatus := make([]*orderpb.OrderStatusCount, len(data.ByStatus))
	for i, s := range data.ByStatus {
		byStatus[i] = &orderpb.OrderStatusCount{
			Status: s.Status,
			Count:  s.Count,
		}
	}

	return &orderpb.GetAnalyticsResponse{
		TotalOrders:      data.TotalOrders,
		OrdersThisMonth:  data.OrdersThisMonth,
		ByStatus:         byStatus,
		TotalRevenue:     data.TotalRevenue,
		RevenueThisMonth: data.RevenueThisMonth,
		AvgOrderValue:    data.AvgOrderValue,
		CompletionRate:   data.CompletionRate,
	}, nil
}

// ====================== PROTO CONVERTER ======================
func toProtoOrder(o domain.Order) *orderpb.Order {
	return &orderpb.Order{
		Id:              o.ID,
		CustomerId:      o.CustomerID,
		ProviderId:      o.ProviderID,
		ServiceId:       o.ServiceID,
		AddressId:       o.AddressID,
		ScheduledAt:     o.ScheduledAt.Format(time.RFC3339),
		AgreedPrice:     o.AgreedPrice,
		Status:          string(o.Status),
		RejectionReason: o.RejectionReason,
		CreatedAt:       o.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       o.UpdatedAt.Format(time.RFC3339),
		PhotoUrls:       o.PhotoUrls,
	}
}

func toProtoDisputedOrder(d domain.DisputedOrder) *orderpb.DisputedOrderProto {
	return &orderpb.DisputedOrderProto{
		Id:            d.ID,
		OrderId:       d.OrderID,
		Order:         toProtoOrder(d.Order),
		DisputeReason: d.DisputeReason,
		RaisedBy:      d.RaisedBy,
		CreatedAt:     d.CreatedAt.Format(time.RFC3339),
		PhotoUrls:     d.PhotoUrls,
	}
}
