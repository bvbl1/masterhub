package ports

import (
	"context"
	"io"

	"github.com/Rask1lll/masterhub/backend/media/internal/application/core/domain"
)

type APIPort interface {
	UploadMedia(ctx context.Context, uploadCtx, filename, contentType string, size int64, reader io.Reader) (domain.Media, error)
	UploadManyMedia(ctx context.Context, uploadCtx string, files []File) ([]domain.Media, error)
	GetMedia(ctx context.Context, mediaId int64) (domain.Media, error)
	GetManyMedia(ctx context.Context, mediaIds []int64) ([]domain.Media, error)
	DeleteMedia(ctx context.Context, mediaId int64) error
	DeleteManyMedia(ctx context.Context, mediaIds []int64) error
	GetByUploader(ctx context.Context, mediaCtx string) ([]domain.Media, error)
	GetPresignedURL(ctx context.Context, mediaId int64) (string, error)
}
