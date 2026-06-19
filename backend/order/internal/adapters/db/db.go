package db

import (
	"context"
	"fmt"
	"time"

	"github.com/Rask1lll/masterhub/backend/order/internal/application/core/domain"
	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Order struct {
	gorm.Model
	CustomerID      int64          `gorm:"not null;index"`
	ProviderID      int64          `gorm:"not null;index"`
	ServiceID       int64          `gorm:"not null;index"`
	AddressID       int64          `gorm:"not null"`
	ScheduledAt     time.Time      `gorm:"not null"`
	AgreedPrice     float64        `gorm:"type:numeric(10,2);not null"`
	Status          string         `gorm:"type:varchar(50);not null;index"`
	RejectionReason string         `gorm:"type:text"`
	PhotoURLs       pq.StringArray `gorm:"type:text[]"`
}

type DisputedOrder struct {
	gorm.Model
	OrderID       int64          `gorm:"not null;uniqueIndex"` // one dispute per order
	RaisedBy      int64          `gorm:"not null"`
	DisputeReason string         `gorm:"type:text;not null"`
	PhotoURLs     pq.StringArray `gorm:"type:text[]"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&Order{}, &DisputedOrder{})
	if err != nil {
		return nil, err
	}

	return &Adapter{db: db}, nil
}

func toDomain(m Order) domain.Order {
	return domain.Order{
		ID:              int64(m.ID),
		CustomerID:      m.CustomerID,
		ProviderID:      m.ProviderID,
		ServiceID:       m.ServiceID,
		AddressID:       m.AddressID,
		ScheduledAt:     m.ScheduledAt,
		AgreedPrice:     m.AgreedPrice,
		Status:          domain.OrderStatus(m.Status),
		RejectionReason: m.RejectionReason,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
		PhotoUrls:       []string(m.PhotoURLs),
	}
}

func toModel(o domain.Order) Order {
	return Order{
		CustomerID:      o.CustomerID,
		ProviderID:      o.ProviderID,
		ServiceID:       o.ServiceID,
		AddressID:       o.AddressID,
		ScheduledAt:     o.ScheduledAt,
		AgreedPrice:     o.AgreedPrice,
		Status:          string(o.Status),
		RejectionReason: o.RejectionReason,
		PhotoURLs:       pq.StringArray(o.PhotoUrls),
	}
}

func (a *Adapter) Create(ctx context.Context, order domain.Order) (domain.Order, error) {
	model := toModel(order)

	if err := a.db.WithContext(ctx).Create(&model).Error; err != nil {
		return domain.Order{}, fmt.Errorf("failed to create order: %w", err)
	}

	return toDomain(model), nil
}

func (a *Adapter) GetByID(ctx context.Context, id int64) (domain.Order, error) {
	var model Order
	if err := a.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.Order{}, fmt.Errorf("order not found")
		}
		return domain.Order{}, fmt.Errorf("failed to get order: %w", err)
	}
	return toDomain(model), nil
}

func (a *Adapter) ListByUserID(ctx context.Context, userID int64) ([]domain.Order, error) {
	var models []Order

	err := a.db.WithContext(ctx).
		Where("customer_id = ? OR provider_id = ?", userID, userID).
		Order("created_at DESC").
		Find(&models).Error

	if err != nil {
		return nil, fmt.Errorf("failed to list orders: %w", err)
	}

	orders := make([]domain.Order, len(models))
	for i, m := range models {
		orders[i] = toDomain(m)
	}

	return orders, nil
}

func (a *Adapter) UpdateStatus(ctx context.Context, id int64, status domain.OrderStatus) (domain.Order, error) {
	var model Order
	if err := a.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.Order{}, fmt.Errorf("order not found")
		}
		return domain.Order{}, fmt.Errorf("failed to find order: %w", err)
	}

	model.Status = string(status)
	if err := a.db.WithContext(ctx).Save(&model).Error; err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status: %w", err)
	}

	return toDomain(model), nil
}

func (a *Adapter) UpdateStatusWithReason(ctx context.Context, id int64, status domain.OrderStatus, reason string) (domain.Order, error) {
	var model Order
	if err := a.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.Order{}, fmt.Errorf("order not found")
		}
		return domain.Order{}, fmt.Errorf("failed to find order: %w", err)
	}

	model.Status = string(status)
	model.RejectionReason = reason

	if err := a.db.WithContext(ctx).Save(&model).Error; err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status with reason: %w", err)
	}

	return toDomain(model), nil
}

func (a *Adapter) CreateDisputedOrder(ctx context.Context, d domain.DisputedOrder) (domain.DisputedOrder, error) {
	model := DisputedOrder{
		OrderID:       d.OrderID,
		RaisedBy:      d.RaisedBy,
		DisputeReason: d.DisputeReason,
		PhotoURLs:     pq.StringArray(d.PhotoUrls),
	}

	if err := a.db.WithContext(ctx).Create(&model).Error; err != nil {
		return domain.DisputedOrder{}, fmt.Errorf("failed to create disputed order: %w", err)
	}

	return toDomainDisputed(model), nil
}

func (a *Adapter) GetDisputedOrder(ctx context.Context, orderID int64) (domain.DisputedOrder, error) {
	var model DisputedOrder

	if err := a.db.WithContext(ctx).Where("order_id = ?", orderID).First(&model).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.DisputedOrder{}, fmt.Errorf("disputed order not found")
		}
		return domain.DisputedOrder{}, fmt.Errorf("failed to get disputed order: %w", err)
	}

	return toDomainDisputed(model), nil
}

func (a *Adapter) ListDisputedOrders(ctx context.Context) ([]domain.DisputedOrder, error) {
	var models []DisputedOrder

	if err := a.db.WithContext(ctx).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, fmt.Errorf("failed to list disputed orders: %w", err)
	}

	disputes := make([]domain.DisputedOrder, len(models))
	for i, m := range models {
		d := toDomainDisputed(m)

		var orderModel Order
		if err := a.db.WithContext(ctx).First(&orderModel, m.OrderID).Error; err == nil {
			d.Order = toDomain(orderModel)
		}

		disputes[i] = d
	}

	return disputes, nil
}

func (a *Adapter) GetAnalytics(ctx context.Context) (*domain.OrderAnalytics, error) {
	var analytics domain.OrderAnalytics

	// Total orders
	if err := a.db.WithContext(ctx).
		Model(&Order{}).
		Count(&analytics.TotalOrders).Error; err != nil {
		return nil, err
	}

	// Orders this month
	startOfMonth := time.Now().UTC().Truncate(24*time.Hour).AddDate(0, 0, -time.Now().Day()+1)
	if err := a.db.WithContext(ctx).
		Model(&Order{}).
		Where("created_at >= ?", startOfMonth).
		Count(&analytics.OrdersThisMonth).Error; err != nil {
		return nil, err
	}

	// By status — one query, GROUP BY
	type statusRow struct {
		Status string
		Count  int64
	}
	var rows []statusRow
	if err := a.db.WithContext(ctx).
		Model(&Order{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	for _, r := range rows {
		analytics.ByStatus = append(analytics.ByStatus, domain.OrderStatusCount{
			Status: r.Status,
			Count:  r.Count,
		})
	}

	// Total revenue (completed orders only)
	if err := a.db.WithContext(ctx).
		Model(&Order{}).
		Where("status = ?", "completed").
		Select("COALESCE(SUM(agreed_price), 0)").
		Scan(&analytics.TotalRevenue).Error; err != nil {
		return nil, err
	}

	// Revenue this month
	if err := a.db.WithContext(ctx).
		Model(&Order{}).
		Where("status = ? AND created_at >= ?", "completed", startOfMonth).
		Select("COALESCE(SUM(agreed_price), 0)").
		Scan(&analytics.RevenueThisMonth).Error; err != nil {
		return nil, err
	}

	// Avg order value (all orders with a price)
	if err := a.db.WithContext(ctx).
		Model(&Order{}).
		Select("COALESCE(AVG(agreed_price), 0)").
		Scan(&analytics.AvgOrderValue).Error; err != nil {
		return nil, err
	}

	// Completion rate
	if analytics.TotalOrders > 0 {
		var completed int64
		if err := a.db.WithContext(ctx).
			Model(&Order{}).
			Where("status = ?", "completed").
			Count(&completed).Error; err != nil {
			return nil, err
		}
		analytics.CompletionRate = float64(completed) / float64(analytics.TotalOrders)
	}

	return &analytics, nil
}

func toDomainDisputed(m DisputedOrder) domain.DisputedOrder {
	return domain.DisputedOrder{
		ID:            int64(m.ID),
		OrderID:       m.OrderID,
		RaisedBy:      m.RaisedBy,
		DisputeReason: m.DisputeReason,
		CreatedAt:     m.CreatedAt,
		PhotoUrls:     []string(m.PhotoURLs),
	}
}
