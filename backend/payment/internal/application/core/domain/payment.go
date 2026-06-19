package domain

import "time"

type Payment struct {
	ID            int64     `gorm:"primaryKey;autoIncrement"`
	OrderID       int64     `gorm:"uniqueIndex;not null"`
	Amount        float64   `gorm:"type:numeric(10,2);not null"`
	Status        string    `gorm:"type:varchar(50);not null"` // unpaid | pending | paid | failed
	TransactionID string    `gorm:"uniqueIndex"`               // Stripe PaymentIntent ID (pi_xxx)
	ClientSecret  string    `gorm:"type:text"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"`
}
