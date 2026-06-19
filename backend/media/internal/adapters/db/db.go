package db

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/media/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/media/internal/ports"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Media struct {
	gorm.Model
	UploaderId int64  `gorm:"not null;index"`
	Context    string `gorm:"not null;size:50"`
	Url        string `gorm:"not null;type:text"`
	Filename   string `gorm:"not null;type:text"`
	SizeBytes  int64  `gorm:"not null"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&Media{}); err != nil {
		return nil, err
	}
	return &Adapter{db: db}, nil
}

func (a *Adapter) Create(ctx context.Context, uploaderId int64, uploadCtx, url, filename string, sizeBytes int64) (domain.Media, error) {
	record := Media{
		UploaderId: uploaderId,
		Context:    uploadCtx,
		Url:        url,
		Filename:   filename,
		SizeBytes:  sizeBytes,
	}

	if err := a.db.WithContext(ctx).Create(&record).Error; err != nil {
		return domain.Media{}, fmt.Errorf("db create media: %w", err)
	}

	return toDomain(record), nil
}

func (a *Adapter) CreateMany(ctx context.Context, uploaderId int64, uploadCtx string, files []ports.CreateManyInput) ([]domain.Media, error) {
	records := make([]Media, len(files))
	for i, f := range files {
		records[i] = Media{
			UploaderId: uploaderId,
			Context:    uploadCtx,
			Url:        f.URL,
			Filename:   f.Filename,
			SizeBytes:  f.SizeBytes,
		}
	}

	// Single transaction — all records inserted or none
	if err := a.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return tx.Create(&records).Error
	}); err != nil {
		return nil, fmt.Errorf("db create many media: %w", err)
	}

	result := make([]domain.Media, len(records))
	for i, r := range records {
		result[i] = toDomain(r)
	}
	return result, nil
}

func (a *Adapter) Get(ctx context.Context, mediaId int64) (domain.Media, error) {
	var record Media
	if err := a.db.WithContext(ctx).First(&record, mediaId).Error; err != nil {
		return domain.Media{}, fmt.Errorf("db get media %d: %w", mediaId, err)
	}
	return toDomain(record), nil
}

func (a *Adapter) GetMany(ctx context.Context, mediaIds []int64) ([]domain.Media, error) {
	var records []Media
	if err := a.db.WithContext(ctx).Where("id IN ?", mediaIds).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("db get many media: %w", err)
	}

	// Find returns no error when records are missing — check count explicitly
	if len(records) != len(mediaIds) {
		return nil, fmt.Errorf("some media ids not found: requested %d, got %d", len(mediaIds), len(records))
	}

	result := make([]domain.Media, len(records))
	for i, r := range records {
		result[i] = toDomain(r)
	}
	return result, nil
}

func (a *Adapter) GetByUploader(ctx context.Context, uploaderId int64, uploadCtx string) ([]domain.Media, error) {
	var records []Media

	query := a.db.WithContext(ctx).Where("uploader_id = ?", uploaderId)

	// uploadCtx is optional — empty string means return all contexts
	if uploadCtx != "" {
		query = query.Where("context = ?", uploadCtx)
	}

	if err := query.Find(&records).Error; err != nil {
		return nil, fmt.Errorf("db get by uploader %d: %w", uploaderId, err)
	}

	result := make([]domain.Media, len(records))
	for i, r := range records {
		result[i] = toDomain(r)
	}
	return result, nil
}

func (a *Adapter) Delete(ctx context.Context, mediaId int64) error {
	result := a.db.WithContext(ctx).Delete(&Media{}, mediaId)
	if result.Error != nil {
		return fmt.Errorf("db delete media %d: %w", mediaId, result.Error)
	}
	// RowsAffected = 0 means the record didn't exist — treat as not found
	if result.RowsAffected == 0 {
		return fmt.Errorf("media %d not found", mediaId)
	}
	return nil
}

func (a *Adapter) DeleteMany(ctx context.Context, mediaIds []int64) error {
	result := a.db.WithContext(ctx).Delete(&Media{}, mediaIds)
	if result.Error != nil {
		return fmt.Errorf("db delete many media: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("no media records found for ids: %v", mediaIds)
	}
	return nil
}

// toDomain maps the GORM model to the clean domain struct.
// The domain layer never imports GORM — this mapping lives here in the adapter.
func toDomain(m Media) domain.Media {
	return domain.Media{
		Id:         int64(m.ID),
		UploaderId: m.UploaderId,
		Context:    m.Context,
		Url:        m.Url,
		Filename:   m.Filename,
		SizeBytes:  m.SizeBytes,
		CreatedAt:  m.CreatedAt,
	}
}
