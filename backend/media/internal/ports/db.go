package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/media/internal/application/core/domain"
)

type DBPort interface {
	Create(ctx context.Context, uploaderId int64, uploadCtx, url, filename string, sizeBytes int64) (domain.Media, error)

	// CreateMany — one DB transaction for all files in a batch upload
	// much better than calling Create N times separately
	CreateMany(ctx context.Context, uploaderId int64, uploadCtx string, files []CreateManyInput) ([]domain.Media, error)

	Get(ctx context.Context, mediaId int64) (domain.Media, error)

	// GetMany by IDs — order-service, review-service will call this
	// to resolve a list of media IDs into full records
	GetMany(ctx context.Context, mediaIds []int64) ([]domain.Media, error)

	// GetByUploader — list all files uploaded by a user,
	// optionally filtered by context (e.g. all service_photos for provider 67)
	GetByUploader(ctx context.Context, uploaderId int64, uploadCtx string) ([]domain.Media, error)

	Delete(ctx context.Context, mediaId int64) error

	// DeleteMany — single DB call instead of N roundtrips
	DeleteMany(ctx context.Context, mediaIds []int64) error
}

// CreateManyInput carries the per-file data for a batch DB insert
type CreateManyInput struct {
	URL       string
	Filename  string
	SizeBytes int64
}
