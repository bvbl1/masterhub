package ports

import (
	"context"
	"io"
	"time"
)

// File holds everything needed to upload a single object to S3.
// Size comes from multipart.FileHeader.Size — never trust the client to send it.
type File struct {
	Key         string // e.g. "service_photos/42/1234567890-kitchen.jpg"
	Filename    string
	ContentType string    // e.g. "image/jpeg"
	Size        int64     // byte count, from multipart header
	Reader      io.Reader // file content stream
}

// UploadResult pairs the original key with the resulting public URL.
// Using a struct instead of parallel slices keeps results unambiguous
// even if some uploads fail partially.
type UploadResult struct {
	Key string
	URL string
}

type S3Port interface {
	// Upload uploads a single file and returns its public URL.
	Upload(ctx context.Context, file File) (string, error)

	// UploadMany uploads multiple files concurrently and returns one
	// UploadResult per input file, in the same order.
	// Returns an error if ANY upload fails — callers should treat this
	// as all-or-nothing and clean up on error.
	UploadMany(ctx context.Context, files []File) ([]UploadResult, error)

	// GetOne returns a readable stream for the object at key.
	// Caller must close the returned ReadCloser.
	GetOne(ctx context.Context, key string) (io.ReadCloser, error)

	// GetMany returns readable streams for multiple keys, in the same order.
	// Caller must close each ReadCloser.
	GetMany(ctx context.Context, keys []string) ([]io.ReadCloser, error)

	// Delete removes the object at key from storage.
	Delete(ctx context.Context, key string) error

	// DeleteMany removes multiple objects. Continues on individual failures
	// and returns a combined error listing all keys that failed.
	DeleteMany(ctx context.Context, keys []string) error

	GeneratePresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error)
}
