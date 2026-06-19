package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/Rask1lll/masterhub/backend/review/internal/application/core/domain"
	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Review struct {
	gorm.Model
	OrderId    int64          `gorm:"not null;uniqueIndex"`
	ServiceId  int64          `gorm:"not null"`
	ReviewerId int64          `gorm:"not null"`
	ProviderId int64          `gorm:"not null;index"`
	Rating     int            `gorm:"not null;check:rating >= 1 AND rating <= 5"`
	Comment    string         `gorm:"type:text"`
	PhotoURLs  pq.StringArray `gorm:"type:text[]"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&Review{}); err != nil {
		return nil, err
	}

	if err := seedReviews(db); err != nil {
		log.Printf("Warning: failed to seed reviews: %v", err)
	}

	return &Adapter{db: db}, nil
}

// fromDomain — add ProviderId mapping
func fromDomain(r domain.Review) Review {
	return Review{
		OrderId:    r.OrderId,
		ServiceId:  r.ServiceId,
		ReviewerId: r.ReviewerId,
		ProviderId: r.ProviderId,
		Rating:     r.Rating,
		Comment:    r.Comment,
		PhotoURLs:  pq.StringArray(r.PhotoURLs),
	}
}

// toDomain — add ProviderId mapping
func toDomain(r Review) domain.Review {
	return domain.Review{
		ID:         int64(r.ID),
		OrderId:    r.OrderId,
		ServiceId:  r.ServiceId,
		ReviewerId: r.ReviewerId,
		ProviderId: r.ProviderId,
		Rating:     r.Rating,
		Comment:    r.Comment,
		PhotoURLs:  []string(r.PhotoURLs),
		CreatedAt:  r.CreatedAt,
	}
}
func (a *Adapter) Create(ctx context.Context, review domain.Review) (domain.Review, error) {
	row := fromDomain(review)
	result := a.db.WithContext(ctx).Create(&row)
	if result.Error != nil {
		return domain.Review{}, fmt.Errorf("db create review: %w", result.Error)
	}
	return toDomain(row), nil
}

func (a *Adapter) Get(ctx context.Context, reviewId int64) (domain.Review, error) {
	var row Review
	result := a.db.WithContext(ctx).First(&row, reviewId)
	if result.Error != nil {
		return domain.Review{}, fmt.Errorf("db get review: %w", result.Error)
	}
	return toDomain(row), nil
}

func (a *Adapter) ListByService(ctx context.Context, serviceId int64, limit, offset int32) ([]domain.Review, float64, error) {
	if limit <= 0 {
		limit = 10
	}
	var rows []Review
	result := a.db.WithContext(ctx).
		Where("service_id = ?", serviceId).
		Order("created_at DESC").
		Limit(int(limit)).
		Offset(int(offset)).
		Find(&rows)
	if result.Error != nil {
		return nil, 0, fmt.Errorf("db list by service: %w", result.Error)
	}

	avg, err := a.calcAvg(ctx, "service_id = ?", serviceId)
	if err != nil {
		return nil, 0, err
	}

	reviews := make([]domain.Review, 0, len(rows))
	for _, r := range rows {
		reviews = append(reviews, toDomain(r))
	}
	return reviews, avg, nil
}

func (a *Adapter) ListByProvider(ctx context.Context, providerId int64, limit, offset int32) ([]domain.Review, float64, error) {
	if limit <= 0 {
		limit = 10
	}
	var rows []Review
	result := a.db.WithContext(ctx).
		Where("provider_id = ?", providerId).
		Order("created_at DESC").
		Limit(int(limit)).
		Offset(int(offset)).
		Find(&rows)
	if result.Error != nil {
		return nil, 0, fmt.Errorf("db list by provider: %w", result.Error)
	}

	avg, err := a.calcAvg(ctx, "provider_id = ?", providerId)
	if err != nil {
		return nil, 0, err
	}

	reviews := make([]domain.Review, 0, len(rows))
	for _, r := range rows {
		reviews = append(reviews, toDomain(r))
	}
	return reviews, avg, nil
}

func (a *Adapter) IsReviewLeft(userId, orderId int64) (bool, error) {
	var count int64
	result := a.db.WithContext(context.Background()).
		Model(&Review{}).
		Where("reviewer_id = ? AND order_id = ?", userId, orderId).
		Count(&count)
	if result.Error != nil {
		return false, fmt.Errorf("db check review left: %w", result.Error)
	}
	return count > 0, nil
}

func (a *Adapter) List(ctx context.Context, limit, offset int32) ([]domain.Review, float64, error) {
	if limit <= 0 {
		limit = 10
	}
	var rows []Review
	result := a.db.WithContext(ctx).
		Order("created_at DESC").
		Limit(int(limit)).
		Offset(int(offset)).
		Find(&rows)
	if result.Error != nil {
		return nil, 0, fmt.Errorf("db list reviews: %w", result.Error)
	}

	avg, err := a.calcAvg(ctx, "TRUE", nil)
	if err != nil {
		return nil, 0, err
	}

	reviews := make([]domain.Review, 0, len(rows))
	for _, r := range rows {
		reviews = append(reviews, toDomain(r))
	}
	return reviews, avg, nil
}

// calcAvg runs a single AVG(rating) query for a given WHERE condition.
// Returns 0.0 if there are no matching rows.
func (a *Adapter) calcAvg(ctx context.Context, condition string, value any) (float64, error) {
	var avg *float64 // pointer so we can detect NULL (no rows)
	result := a.db.WithContext(ctx).
		Model(&Review{}).
		Where(condition, value).
		Select("AVG(rating)").
		Scan(&avg)
	if result.Error != nil {
		return 0, fmt.Errorf("db calc avg: %w", result.Error)
	}
	if avg == nil {
		return 0, nil // no reviews yet
	}
	return *avg, nil
}

// avgResult is used for AVG scan — kept private
type avgResult struct {
	Avg *float64
	At  time.Time // unused, prevents zero-value scan issues on some drivers
}
