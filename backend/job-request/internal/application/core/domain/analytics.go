package domain

type JobRequestAnalytics struct {
	TotalJobRequests     int64 `json:"total_job_requests"`
	JobRequestsThisMonth int64 `json:"job_requests_this_month"`
	OpenJobRequests      int64 `json:"open_job_requests"`
	ClosedJobRequests    int64 `json:"closed_job_requests"`
	CancelledJobRequests int64 `json:"cancelled_job_requests"`
	TotalResponses       int64 `json:"total_responses"`
	ResponsesThisMonth   int64 `json:"responses_this_month"`
}
