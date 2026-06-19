package domain

import "time"

type JobRequestResponseStatus string

const (
	StatusPending   JobRequestResponseStatus = "pending"
	StatusAccepted  JobRequestResponseStatus = "accepted"
	StatusRejected  JobRequestResponseStatus = "rejected"
	StatusWithdrawn JobRequestResponseStatus = "withdrawn"
)

type JobRequestResponse struct {
	ID            int64                    `json:"id"`
	JobRequestID  int64                    `json:"job_request_id"`
	ProviderID    int64                    `json:"provider_id"`
	ProposedPrice float64                  `json:"proposed_price"`
	Comment       string                   `json:"comment"`
	EstimatedDays int32                    `json:"estimated_days"`
	Status        JobRequestResponseStatus `json:"status"`
	CreatedAt     time.Time                `json:"created_at"`
	UpdatedAt     time.Time                `json:"updated_at"`
}

// ValidResponseTransitions defines allowed status transitions for a JobRequestResponse.
//
//	pending → accepted  : customer chose this provider
//	pending → rejected  : customer chose a different provider (set on all others when one is accepted)
//	pending → withdrawn : provider pulled their own bid
var ValidResponseTransitions = map[JobRequestResponseStatus][]JobRequestResponseStatus{
	StatusPending: {StatusAccepted, StatusRejected, StatusWithdrawn},
}

func (r *JobRequestResponse) CanTransitionTo(next JobRequestResponseStatus) bool {
	allowed, ok := ValidResponseTransitions[r.Status]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == next {
			return true
		}
	}
	return false
}
