package grpc

import (
	"bytes"
	"context"
	"fmt"
	"mime"
	"path/filepath"
	"time"

	"github.com/Rask1lll/masterhub/backend/media/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/media/internal/ports"
	mediapb "github.com/bvbl1/masterhub-proto/golang/media"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Adapter) UploadMedia(ctx context.Context, req *mediapb.UploadMediaRequest) (*mediapb.UploadMediaResponse, error) {
	if req.Context == "" || req.Filename == "" {
		return nil, status.Error(codes.InvalidArgument, "context and filename are required")
	}
	if len(req.Data) == 0 {
		return nil, status.Error(codes.InvalidArgument, "file data must not be empty")
	}

	contentType := detectContentType(req.Filename)

	media, err := s.api.UploadMedia(
		ctx,
		req.Context,
		req.Filename,
		contentType,
		int64(len(req.Data)), // size derived from actual bytes — never trust req.SizeBytes from client
		bytes.NewReader(req.Data),
	)
	if err != nil {
		return nil, toGRPCError(err)
	}

	return &mediapb.UploadMediaResponse{
		Media: toProto(media),
	}, nil
}

func (s *Adapter) UploadManyMedia(ctx context.Context, req *mediapb.UploadManyMediaRequest) (*mediapb.UploadManyMediaResponse, error) {
	if req.Context == "" {
		return nil, status.Error(codes.InvalidArgument, "context is required")
	}
	if len(req.Files) == 0 {
		return nil, status.Error(codes.InvalidArgument, "files must not be empty")
	}

	files := make([]ports.File, len(req.Files))
	for i, f := range req.Files {
		if f.Filename == "" {
			return nil, status.Errorf(codes.InvalidArgument, "file[%d]: filename is required", i)
		}
		if len(f.Data) == 0 {
			return nil, status.Errorf(codes.InvalidArgument, "file[%d]: data must not be empty", i)
		}
		contentType := detectContentType(f.Filename)
		files[i] = ports.File{
			Filename:    f.Filename,
			ContentType: contentType,
			Size:        int64(len(f.Data)),
			Reader:      bytes.NewReader(f.Data),
		}
	}

	mediaList, err := s.api.UploadManyMedia(ctx, req.Context, files)
	if err != nil {
		return nil, toGRPCError(err)
	}

	protoMedia := make([]*mediapb.MediaItem, len(mediaList))
	for i, m := range mediaList {
		protoMedia[i] = toProto(m)
	}

	return &mediapb.UploadManyMediaResponse{
		Media: protoMedia,
	}, nil
}

func (s *Adapter) GetMedia(ctx context.Context, req *mediapb.GetMediaRequest) (*mediapb.GetMediaResponse, error) {
	if req.MediaId == 0 {
		return nil, status.Error(codes.InvalidArgument, "media_id is required")
	}

	media, err := s.api.GetMedia(ctx, req.MediaId)
	if err != nil {
		return nil, toGRPCError(err)
	}

	return &mediapb.GetMediaResponse{
		Media: toProto(media),
	}, nil
}

func (s *Adapter) GetManyMedia(ctx context.Context, req *mediapb.GetManyMediaRequest) (*mediapb.GetManyMediaResponse, error) {
	if len(req.MediaIds) == 0 {
		return nil, status.Error(codes.InvalidArgument, "media_ids must not be empty")
	}

	mediaList, err := s.api.GetManyMedia(ctx, req.MediaIds)
	if err != nil {
		return nil, toGRPCError(err)
	}

	protoMedia := make([]*mediapb.MediaItem, len(mediaList))
	for i, m := range mediaList {
		protoMedia[i] = toProto(m)
	}

	return &mediapb.GetManyMediaResponse{
		Media: protoMedia,
	}, nil
}

func (s *Adapter) GetMyMedia(ctx context.Context, req *mediapb.GetMyMediaRequest) (*mediapb.GetMyMediaResponse, error) {
	// uploaderId extracted from JWT inside GetMyMedia business logic
	// req.Context is optional — empty string returns all contexts
	mediaList, err := s.api.GetByUploader(ctx, req.Context)
	if err != nil {
		return nil, toGRPCError(err)
	}

	protoMedia := make([]*mediapb.MediaItem, len(mediaList))
	for i, m := range mediaList {
		protoMedia[i] = toProto(m)
	}

	return &mediapb.GetMyMediaResponse{
		Media: protoMedia,
	}, nil
}

func (s *Adapter) DeleteMedia(ctx context.Context, req *mediapb.DeleteMediaRequest) (*mediapb.DeleteMediaResponse, error) {
	if req.MediaId == 0 {
		return nil, status.Error(codes.InvalidArgument, "media_id is required")
	}

	if err := s.api.DeleteMedia(ctx, req.MediaId); err != nil {
		return nil, toGRPCError(err)
	}

	return &mediapb.DeleteMediaResponse{Success: true}, nil
}

func (s *Adapter) DeleteManyMedia(ctx context.Context, req *mediapb.DeleteManyMediaRequest) (*mediapb.DeleteManyMediaResponse, error) {
	if len(req.MediaIds) == 0 {
		return nil, status.Error(codes.InvalidArgument, "media_ids must not be empty")
	}

	if err := s.api.DeleteManyMedia(ctx, req.MediaIds); err != nil {
		return nil, toGRPCError(err)
	}

	return &mediapb.DeleteManyMediaResponse{
		Success: true,
		Deleted: int32(len(req.MediaIds)),
	}, nil
}

func (s *Adapter) GetPresignedURL(ctx context.Context, req *mediapb.GetPresignedURLRequest) (*mediapb.GetPresignedURLResponse, error) {
	if req.MediaId == 0 {
		return nil, status.Error(codes.InvalidArgument, "media_id is required")
	}

	url, err := s.api.GetPresignedURL(ctx, req.MediaId)
	if err != nil {
		return nil, toGRPCError(err)
	}

	return &mediapb.GetPresignedURLResponse{Url: url}, nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func toProto(m domain.Media) *mediapb.MediaItem {
	return &mediapb.MediaItem{
		MediaId:    m.Id,
		UploaderId: m.UploaderId,
		Context:    m.Context,
		Url:        m.Url,
		Filename:   m.Filename,
		SizeBytes:  m.SizeBytes,
		CreatedAt:  m.CreatedAt.Format(time.RFC3339),
	}
}

// toGRPCError converts business logic errors to appropriate gRPC status codes.
func toGRPCError(err error) error {
	msg := err.Error()
	switch {
	case contains(msg, "not found"):
		return status.Error(codes.NotFound, msg)
	case contains(msg, "permission denied"):
		return status.Error(codes.PermissionDenied, msg)
	case contains(msg, "unauthorized"):
		return status.Error(codes.Unauthenticated, msg)
	case contains(msg, "invalid"):
		return status.Error(codes.InvalidArgument, msg)
	default:
		return status.Error(codes.Internal, fmt.Sprintf("internal error: %s", msg))
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsStr(s, substr))
}

func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func detectContentType(filename string) string {
	ext := filepath.Ext(filename) // ".jpg", ".png", ".pdf"
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		return "application/octet-stream" // safe fallback
	}
	return mimeType
}
