package db

import (
	"github.com/Rask1lll/masterhub/backend/payment/internal/application/core/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&domain.Payment{}); err != nil {
		return nil, err
	}
	return &Adapter{db: db}, nil
}

func (a *Adapter) CreatePayment(p *domain.Payment) error {
	return a.db.Create(p).Error
}

func (a *Adapter) GetPaymentByOrderID(orderID int64) (*domain.Payment, error) {
	var p domain.Payment
	if err := a.db.Where("order_id = ?", orderID).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (a *Adapter) UpdatePaymentStatusByTransactionID(transactionID string, status string) error {
	return a.db.Model(&domain.Payment{}).
		Where("transaction_id = ?", transactionID).
		Update("status", status).Error
}

func (a *Adapter) GetPaymentByTransactionID(transactionID string) (*domain.Payment, error) {
	var p domain.Payment
	if err := a.db.Where("transaction_id = ?", transactionID).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}
