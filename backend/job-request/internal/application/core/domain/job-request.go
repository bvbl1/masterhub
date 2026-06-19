package domain

import "time"

type JobRequestStatus string

const (
	StatusOpen      JobRequestStatus = "open"
	StatusClosed    JobRequestStatus = "closed"
	StatusCancelled JobRequestStatus = "cancelled"
)

type JobRequest struct {
	ID            int64            `json:"id"`
	CustomerID    int64            `json:"customer_id"`
	CategoryID    int64            `json:"category_id"`
	Title         string           `json:"title"`
	Description   string           `json:"description"`
	City          string           `json:"city"`
	BudgetMin     float64          `json:"budget_min"`
	BudgetMax     float64          `json:"budget_max"`
	ScheduledAt   time.Time        `json:"scheduled_at"`
	Status        JobRequestStatus `json:"status"`
	ResponseCount int32            `json:"response_count"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
	PhotoUrls     []string         `json:"photo_urls,omitempty"`
}

// ValidJobRequestTransitions defines allowed status transitions for a JobRequest.
//
//	open → closed    : customer accepted a provider response; Order was created
//	open → cancelled : customer cancelled before accepting anyone
var ValidJobRequestTransitions = map[JobRequestStatus][]JobRequestStatus{
	StatusOpen: {StatusClosed, StatusCancelled},
}

func (jr *JobRequest) CanTransitionTo(next JobRequestStatus) bool {
	allowed, ok := ValidJobRequestTransitions[jr.Status]
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
