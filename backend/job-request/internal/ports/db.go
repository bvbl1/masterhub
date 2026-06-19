package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/job-request/internal/application/core/domain"
)

// DBPort is the outbound port.
// The application core calls this interface; the GORM/PostgreSQL adapter implements it.

type DBPort interface {
	// ── Job Request ───────────────────────────────────────────────────────────

	// SaveJobRequest inserts a new job request and returns it with ID and timestamps populated.
	SaveJobRequest(ctx context.Context, jobRequest domain.JobRequest) (domain.JobRequest, error)

	// GetJobRequestByID returns a job request by its primary key.
	// Returns an error wrapping domain.ErrNotFound if not found.
	GetJobRequestByID(ctx context.Context, id int64) (domain.JobRequest, error)

	// ListJobRequests returns job requests matching the given filters.
	// Any zero/empty value means "no filter on that field".
	ListJobRequests(ctx context.Context, status string, categoryID int64, city string, limit, offset int32) ([]domain.JobRequest, error)

	// UpdateJobRequestStatus sets the status column of a job request.
	UpdateJobRequestStatus(ctx context.Context, id int64, status domain.JobRequestStatus) error

	// IncrementResponseCount atomically increments the response_count of a job request by 1.
	IncrementResponseCount(ctx context.Context, jobRequestID int64) error

	// ── Job Request Response ──────────────────────────────────────────────────

	// SaveJobRequestResponse inserts a new provider bid and returns it with ID and timestamps.
	SaveJobRequestResponse(ctx context.Context, response domain.JobRequestResponse) (domain.JobRequestResponse, error)

	// GetJobRequestResponseByID returns a single bid by its primary key.
	// Returns an error wrapping domain.ErrNotFound if not found.
	GetJobRequestResponseByID(ctx context.Context, id int64) (domain.JobRequestResponse, error)

	// ListJobRequestResponses returns all bids for a given job request.
	ListJobRequestResponses(ctx context.Context, jobRequestID int64, limit, offset int32) ([]domain.JobRequestResponse, error)

	// UpdateJobRequestResponseStatus sets the status column of a single bid.
	UpdateJobRequestResponseStatus(ctx context.Context, id int64, status domain.JobRequestResponseStatus) error

	// RejectAllOtherResponses sets status="rejected" on every pending bid for a job request
	// except the one that was accepted. Called atomically inside AcceptJobRequestResponse.
	RejectAllOtherResponses(ctx context.Context, jobRequestID, acceptedResponseID int64) error

	GetJobRequestAnalytics(ctx context.Context) (*domain.JobRequestAnalytics, error)
}
