package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/job-request/internal/application/core/domain"
)

// APIPort is the inbound port.
// The gRPC server adapter calls this interface; the application core implements it.

type APIPort interface {
	// ── Job Request ───────────────────────────────────────────────────────────

	// CreateJobRequest creates a new open job request posted by a customer.
	// customerID is extracted from the validated JWT
	CreateJobRequest(ctx context.Context, categoryID int64, title, description, city string, budgetMin, budgetMax float64, scheduledAt string, photoUrls []string) (domain.JobRequest, error)

	// GetJobRequest returns a single job request by ID.
	GetJobRequest(ctx context.Context, id int64) (domain.JobRequest, error)

	// ListJobRequests returns job requests filtered by optional status, categoryID, and city.
	// Pass empty string / zero values to skip a filter.
	// Providers browse with status="open"; customers call with no status filter to see their own.
	ListJobRequests(ctx context.Context, status string, categoryID int64, city string, limit, offset int32) ([]domain.JobRequest, error)

	// CancelJobRequest sets a job request to "cancelled".
	// Only the customer who owns the request may cancel it, and only when status="open".
	// customerID is extracted from JWT.
	CancelJobRequest(ctx context.Context, id, customerID int64) error

	// ── Job Request Response (provider bids) ──────────────────────────────────

	// RespondToJobRequest lets a provider place a bid on an open job request.
	// providerID is extracted from JWT.
	RespondToJobRequest(ctx context.Context, jobRequestID, providerID int64, proposedPrice float64, comment string, estimatedDays int32) (domain.JobRequestResponse, error)

	// ListJobRequestResponses returns all bids on a given job request.
	// Only the owning customer may list responses.
	// customerID is extracted from JWT for ownership check.
	ListJobRequestResponses(ctx context.Context, jobRequestID, customerID int64, limit, offset int32) ([]domain.JobRequestResponse, error)

	// GetJobRequestResponse returns a single bid by jobRequestID + responseID.
	GetJobRequestResponse(ctx context.Context, jobRequestID, responseID int64) (domain.JobRequestResponse, error)

	// AcceptJobRequestResponse lets the customer accept one provider's bid.
	// Side effects (all atomic within the use-case):
	//   1. accepted response → status="accepted"
	//   2. all other pending responses on the same job request → status="rejected"
	//   3. job request → status="closed"
	//   4. calls order-service.CreateOrder and returns the new orderID
	// customerID is extracted from JWT.
	AcceptJobRequestResponse(ctx context.Context, jobRequestID, responseID, customerID int64, street, city, region string, latitude, longitude float64, scheduledAt string) (domain.JobRequest, int64, error)

	// WithdrawJobRequestResponse lets a provider withdraw their own pending bid.
	// providerID is extracted from JWT.
	WithdrawJobRequestResponse(ctx context.Context, jobRequestID, responseID, providerID int64) error

	GetJobRequestAnalytics(ctx context.Context) (*domain.JobRequestAnalytics, error)
}
