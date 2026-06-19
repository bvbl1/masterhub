package grpc

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/review/internal/application/core/domain"
	reviewpb "github.com/bvbl1/masterhub-proto/golang/review"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) CreateReview(ctx context.Context, req *reviewpb.CreateReviewRequest) (*reviewpb.CreateReviewResponse, error) {
	created, err := a.api.LeaveReview(ctx, req.OrderId, int(req.Rating), req.Comment, req.PhotoUrls)
	if err != nil {
		return nil, domainErrToStatus(err)
	}

	return &reviewpb.CreateReviewResponse{
		Review: domainToProto(created),
	}, nil
}

func (a *Adapter) GetReview(ctx context.Context, req *reviewpb.GetReviewRequest) (*reviewpb.GetReviewResponse, error) {
	review, err := a.api.GetReview(ctx, req.Id)
	if err != nil {
		return nil, domainErrToStatus(err)
	}

	return &reviewpb.GetReviewResponse{
		Review: domainToProto(review),
	}, nil
}

func (a *Adapter) ListReviewsByService(ctx context.Context, req *reviewpb.ListReviewsByServiceRequest) (*reviewpb.ListReviewsResponse, error) {
	reviews, avg, err := a.api.ListReviewsByService(ctx, req.ServiceId, req.Limit, req.Offset)
	if err != nil {
		return nil, domainErrToStatus(err)
	}

	return &reviewpb.ListReviewsResponse{
		Reviews:   domainToProtoList(reviews),
		AvgRating: avg,
	}, nil
}

func (a *Adapter) ListReviewsByProvider(ctx context.Context, req *reviewpb.ListReviewsByProviderRequest) (*reviewpb.ListReviewsResponse, error) {
	reviews, avg, err := a.api.ListReviewsByProvider(ctx, req.ProviderId, req.Limit, req.Offset)
	if err != nil {
		return nil, domainErrToStatus(err)
	}

	return &reviewpb.ListReviewsResponse{
		Reviews:   domainToProtoList(reviews),
		AvgRating: avg,
	}, nil
}

func (a *Adapter) HasReview(ctx context.Context, req *reviewpb.HasReviewRequest) (*reviewpb.HasReviewResponse, error) {
	left, err := a.api.IsReviewLeft(ctx, req.OrderId)
	if err != nil {
		return nil, domainErrToStatus(err)
	}

	return &reviewpb.HasReviewResponse{
		IsReviewed: left,
	}, nil
}

func (a *Adapter) ListReviews(ctx context.Context, req *reviewpb.ListReviewsRequest) (*reviewpb.ListReviewsResponse, error) {
	reviews, avg, err := a.api.ListReviews(ctx, req.Limit, req.Offset)
	if err != nil {
		return nil, domainErrToStatus(err)
	}

	return &reviewpb.ListReviewsResponse{
		Reviews:   domainToProtoList(reviews),
		AvgRating: avg,
	}, nil
}

// --- mapping helpers ---

func domainToProto(r domain.Review) *reviewpb.Review {
	return &reviewpb.Review{
		Id:         r.ID,
		OrderId:    r.OrderId,
		ServiceId:  r.ServiceId,
		ReviewerId: r.ReviewerId,
		Rating:     int32(r.Rating),
		Comment:    r.Comment,
		PhotoUrls:  r.PhotoURLs,
		CreatedAt:  r.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func domainToProtoList(reviews []domain.Review) []*reviewpb.Review {
	out := make([]*reviewpb.Review, 0, len(reviews))
	for _, r := range reviews {
		out = append(out, domainToProto(r))
	}
	return out
}

func domainErrToStatus(err error) error {
	if err == nil {
		return nil
	}
	msg := err.Error()

	switch {
	case contains(msg, "unauthenticated"):
		return status.Error(codes.Unauthenticated, msg)
	case contains(msg, "not found"):
		return status.Error(codes.NotFound, msg)
	case contains(msg, "only the customer"):
		return status.Error(codes.PermissionDenied, msg)
	case contains(msg, "not completed"):
		return status.Error(codes.FailedPrecondition, msg)
	case contains(msg, "already exists"), contains(msg, "duplicate"):
		return status.Error(codes.AlreadyExists, msg)
	case contains(msg, "rating must be"):
		return status.Error(codes.InvalidArgument, msg)
	default:
		return status.Error(codes.Internal, msg)
	}
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
