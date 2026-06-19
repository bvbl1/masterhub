package api

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/Rask1lll/masterhub/backend/media/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/media/internal/ports"
	"github.com/google/uuid"
)

type Application struct {
	db ports.DBPort
	s3 ports.S3Port
}

func NewApplication(db ports.DBPort, s3 ports.S3Port) *Application {
	return &Application{db: db, s3: s3}
}

func (a *Application) UploadMedia(ctx context.Context, uploadCtx, filename, contentType string, size int64, reader io.Reader) (domain.Media, error) {
	if err := validateContext(uploadCtx); err != nil {
		return domain.Media{}, err
	}
	uploaderId := ctx.Value("user_id").(int64)

	// 1. upload to S3
	key := generateKey(uploadCtx, uploaderId, filename)

	url, err := a.s3.Upload(ctx, ports.File{
		Key:         key, // e.g. "service_photos/67/uuid.jpg"
		ContentType: contentType,
		Size:        size,
		Reader:      reader,
	})
	if err != nil {
		return domain.Media{}, fmt.Errorf("failed to upload media to S3: %w", err)
	}

	// 2. save metadata to database
	media, err := a.db.Create(ctx, uploaderId, uploadCtx, url, filename, size)
	if err != nil {
		_ = a.s3.Delete(ctx, key) // best-effort cleanup
		return domain.Media{}, fmt.Errorf("failed to create media in database: %w", err)
	}
	return media, nil
}

func (a *Application) UploadManyMedia(ctx context.Context, uploadCtx string, files []ports.File) ([]domain.Media, error) {
	if err := validateContext(uploadCtx); err != nil {
		return nil, err
	}

	uploaderId := ctx.Value("user_id").(int64)

	// Assign generated keys to each file before uploading
	// We need keys stored separately for cleanup on DB failure
	keys := make([]string, len(files))
	for i, f := range files {
		keys[i] = generateKey(uploadCtx, uploaderId, f.Filename)
		files[i].Key = keys[i]
	}

	results, err := a.s3.UploadMany(ctx, files)
	if err != nil {
		return nil, fmt.Errorf("s3 batch upload failed: %w", err)
	}

	// Build DB inputs from upload results
	dbInputs := make([]ports.CreateManyInput, len(results))
	for i, r := range results {
		dbInputs[i] = ports.CreateManyInput{
			URL:       r.URL,
			Filename:  files[i].Filename,
			SizeBytes: files[i].Size,
		}
	}

	media, err := a.db.CreateMany(ctx, uploaderId, uploadCtx, dbInputs)
	if err != nil {
		// DB failed — clean up everything that was uploaded to S3
		_ = a.s3.DeleteMany(ctx, keys)
		return nil, fmt.Errorf("db batch create failed: %w", err)
	}

	return media, nil
}

func (a *Application) GetMedia(ctx context.Context, mediaId int64) (domain.Media, error) {
	media, err := a.db.Get(ctx, mediaId)
	if err != nil {
		return domain.Media{}, fmt.Errorf("media %d not found: %w", mediaId, err)
	}
	return media, nil
}

func (a *Application) GetManyMedia(ctx context.Context, mediaIds []int64) ([]domain.Media, error) {
	if len(mediaIds) == 0 {
		return nil, fmt.Errorf("media_ids must not be empty")
	}

	media, err := a.db.GetMany(ctx, mediaIds)
	if err != nil {
		return nil, fmt.Errorf("failed to get media: %w", err)
	}
	return media, nil
}

func (a *Application) DeleteMedia(ctx context.Context, mediaId int64) error {
	requesterId := ctx.Value("user_id").(int64)

	media, err := a.db.Get(ctx, mediaId)
	if err != nil {
		return fmt.Errorf("media %d not found: %w", mediaId, err)
	}

	// Ownership check — only the uploader can delete their own file
	if media.UploaderId != requesterId {
		return fmt.Errorf("permission denied: media %d does not belong to you", mediaId)
	}

	// Extract S3 key from stored URL
	key := extractKeyFromURL(media.Url)

	if err = a.s3.Delete(ctx, key); err != nil {
		return fmt.Errorf("s3 delete failed: %w", err)
	}

	if err = a.db.Delete(ctx, mediaId); err != nil {
		// S3 object is already gone at this point — log this but don't
		// re-upload. The DB record is now an orphan pointing to nothing.
		// In production you'd have a reconciliation job for this case.
		return fmt.Errorf("db delete failed after s3 delete — orphaned record %d: %w", mediaId, err)
	}

	return nil
}

func (a *Application) DeleteManyMedia(ctx context.Context, mediaIds []int64) error {
	if len(mediaIds) == 0 {
		return fmt.Errorf("media_ids must not be empty")
	}

	requesterId := ctx.Value("user_id").(int64)

	// Fetch all records first to verify ownership and collect S3 keys
	mediaList, err := a.db.GetMany(ctx, mediaIds)
	if err != nil {
		return fmt.Errorf("failed to fetch media records: %w", err)
	}

	// Verify every record belongs to the requester before deleting anything
	// We check ALL before starting deletes — avoids partial deletes on auth failure
	for _, m := range mediaList {
		if m.UploaderId != requesterId {
			return fmt.Errorf("permission denied: media %d does not belong to you", m.Id)
		}
	}

	keys := make([]string, len(mediaList))
	for i, m := range mediaList {
		keys[i] = extractKeyFromURL(m.Url)
	}

	if err = a.s3.DeleteMany(ctx, keys); err != nil {
		return fmt.Errorf("s3 batch delete failed: %w", err)
	}

	if err = a.db.DeleteMany(ctx, mediaIds); err != nil {
		return fmt.Errorf("db batch delete failed after s3 delete — orphaned records %v: %w", mediaIds, err)
	}

	return nil
}

func (a *Application) GetByUploader(ctx context.Context, mediaCtx string) ([]domain.Media, error) {
	uploaderId := ctx.Value("user_id").(int64)
	media, err := a.db.GetByUploader(ctx, uploaderId, mediaCtx)
	if err != nil {
		return nil, fmt.Errorf("failed to get media by uploader: %w", err)
	}
	return media, nil
}

func (a *Application) GetPresignedURL(ctx context.Context, mediaId int64) (string, error) {
	media, err := a.db.Get(ctx, mediaId)
	if err != nil {
		return "", fmt.Errorf("media %d not found: %w", mediaId, err)
	}

	if media.Context != domain.ProviderDocuments {
		return media.Url, nil
	}

	key := extractKeyFromURL(media.Url)

	presignedURL, err := a.s3.GeneratePresignedURL(ctx, key, 15*time.Minute)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}

	return presignedURL, nil
}

// helper
func validateContext(uploadCtx string) error {
	switch uploadCtx {
	case domain.ProviderDocuments, domain.ServicePhotos, domain.ReviewPhotos, domain.Avatar, domain.ChatMedia, domain.OrderPhotos, domain.JobRequestPhotos, domain.DisputePhotos:
		return nil
	default:
		return fmt.Errorf("invalid upload context: %q", uploadCtx)
	}
}

func generateKey(uploadCtx string, uploaderId int64, filename string) string {
	ext := filepath.Ext(filename)
	return fmt.Sprintf("%s/%d/%s%s", uploadCtx, uploaderId, uuid.New().String(), ext)
}

// extractKeyFromURL strips the host and bucket prefix to get the S3 object key.
// URL format: "https://masterhub-media.s3.eu-north-1.amazonaws.com/service_photos/42/uuid.jpg"
// Key result:                                                          "service_photos/42/uuid.jpg"
func extractKeyFromURL(url string) string {
	parts := strings.SplitN(url, "/", 4)
	if len(parts) < 4 {
		return url
	}
	return parts[3]
}
