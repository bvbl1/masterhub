// adapters/db/models.go
package db

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/notification/internal/application/core/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	UserID int64  `gorm:"not null;index"`
	Title  string `gorm:"type:text;not null"`
	Body   string `gorm:"type:text;not null"`
	Type   string `gorm:"type:varchar(50);not null"`
	IsRead bool   `gorm:"default:false"`
}
type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(&Notification{}); err != nil {
		return nil, err
	}

	return &Adapter{db: db}, nil
}

func (a *Adapter) Create(ctx context.Context, n domain.Notification) (domain.Notification, error) {
	model := Notification{
		UserID: n.UserID,
		Title:  n.Title,
		Body:   n.Body,
		Type:   n.Type,
		IsRead: n.IsRead,
	}
	if err := a.db.WithContext(ctx).Create(&model).Error; err != nil {
		return domain.Notification{}, err
	}
	return toDomain(model), nil
}

func (a *Adapter) ListByUserID(ctx context.Context, userID int64) ([]domain.Notification, error) {
	var models []Notification
	if err := a.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&models).Error; err != nil {
		return nil, err
	}

	notifications := make([]domain.Notification, len(models))
	for i, m := range models {
		notifications[i] = toDomain(m)
	}
	return notifications, nil
}

func (a *Adapter) MarkRead(ctx context.Context, id int64) error {
	return a.db.WithContext(ctx).
		Model(&Notification{}).
		Where("id = ?", id).
		Update("is_read", true).Error
}

func toDomain(m Notification) domain.Notification {
	return domain.Notification{
		ID:        int64(m.ID),
		UserID:    m.UserID,
		Title:     m.Title,
		Body:      m.Body,
		Type:      m.Type,
		IsRead:    m.IsRead,
		CreatedAt: m.CreatedAt,
	}
}
