package grpc

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/job-request/internal/application/core/domain"
	jobrequestpb "github.com/bvbl1/masterhub-proto/golang/job-request"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func protoJobRequest(jr domain.JobRequest) *jobrequestpb.JobRequest {
	return &jobrequestpb.JobRequest{
		Id:            jr.ID,
		CustomerId:    jr.CustomerID,
		CategoryId:    jr.CategoryID,
		Title:         jr.Title,
		Description:   jr.Description,
		City:          jr.City,
		BudgetMin:     jr.BudgetMin,
		BudgetMax:     jr.BudgetMax,
		ScheduledAt:   jr.ScheduledAt.Format("2006-01-02T15:04:05Z07:00"),
		Status:        string(jr.Status),
		ResponseCount: jr.ResponseCount,
		CreatedAt:     jr.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     jr.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		PhotoUrls:     jr.PhotoUrls,
	}
}

func protoJobRequestResponse(r domain.JobRequestResponse) *jobrequestpb.JobRequestResponse {
	return &jobrequestpb.JobRequestResponse{
		Id:            r.ID,
		JobRequestId:  r.JobRequestID,
		ProviderId:    r.ProviderID,
		ProposedPrice: r.ProposedPrice,
		Comment:       r.Comment,
		EstimatedDays: r.EstimatedDays,
		Status:        string(r.Status),
		CreatedAt:     r.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     r.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// ── helpers ───────────────────────────────────────────────────────────────────

func getCallerID(ctx context.Context) (int64, error) {
	id, ok := ctx.Value(ctxUserID).(int64)
	if !ok || id == 0 {
		return 0, status.Error(codes.Unauthenticated, "user_id not found in context")
	}
	return id, nil
}

// ── CreateJobRequest ──────────────────────────────────────────────────────────

func (a *Adapter) CreateJobRequest(ctx context.Context, req *jobrequestpb.CreateJobRequestRequest) (*jobrequestpb.CreateJobRequestResponse, error) {
	jr, err := a.api.CreateJobRequest(
		ctx,
		req.CategoryId,
		req.Title,
		req.Description,
		req.City,
		req.BudgetMin,
		req.BudgetMax,
		req.ScheduledAt,
		req.PhotoUrls,
	)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &jobrequestpb.CreateJobRequestResponse{
		JobRequest: protoJobRequest(jr),
	}, nil
}

// ── GetJobRequest ─────────────────────────────────────────────────────────────

func (a *Adapter) GetJobRequest(ctx context.Context, req *jobrequestpb.GetJobRequestRequest) (*jobrequestpb.GetJobRequestResult, error) {
	jr, err := a.api.GetJobRequest(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &jobrequestpb.GetJobRequestResult{
		JobRequest: protoJobRequest(jr),
	}, nil
}

// ── ListJobRequests ───────────────────────────────────────────────────────────

func (a *Adapter) ListJobRequests(ctx context.Context, req *jobrequestpb.ListJobRequestsRequest) (*jobrequestpb.ListJobRequestsResponse, error) {
	list, err := a.api.ListJobRequests(ctx, req.Status, req.CategoryId, req.City, req.Limit, req.Offset)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	items := make([]*jobrequestpb.JobRequest, len(list))
	for i, jr := range list {
		items[i] = protoJobRequest(jr)
	}

	return &jobrequestpb.ListJobRequestsResponse{
		JobRequests: items,
	}, nil
}

// ── CancelJobRequest ──────────────────────────────────────────────────────────

func (a *Adapter) CancelJobRequest(ctx context.Context, req *jobrequestpb.CancelJobRequestRequest) (*jobrequestpb.CancelJobRequestResponse, error) {
	callerID, err := getCallerID(ctx)
	if err != nil {
		return nil, err
	}

	if err := a.api.CancelJobRequest(ctx, req.Id, callerID); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &jobrequestpb.CancelJobRequestResponse{Success: true}, nil
}

// ── RespondToJobRequest ───────────────────────────────────────────────────────

func (a *Adapter) RespondToJobRequest(ctx context.Context, req *jobrequestpb.RespondToJobRequestRequest) (*jobrequestpb.RespondToJobRequestResponse, error) {
	callerID, err := getCallerID(ctx)
	if err != nil {
		return nil, err
	}

	resp, err := a.api.RespondToJobRequest(ctx, req.JobRequestId, callerID, req.ProposedPrice, req.Comment, req.EstimatedDays)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &jobrequestpb.RespondToJobRequestResponse{
		Response: protoJobRequestResponse(resp),
	}, nil
}

// ── ListJobRequestResponses ───────────────────────────────────────────────────

func (a *Adapter) ListJobRequestResponses(ctx context.Context, req *jobrequestpb.ListJobRequestResponsesRequest) (*jobrequestpb.ListJobRequestResponsesResponse, error) {
	callerID, err := getCallerID(ctx)
	if err != nil {
		return nil, err
	}

	list, err := a.api.ListJobRequestResponses(ctx, req.JobRequestId, callerID, req.Limit, req.Offset)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	items := make([]*jobrequestpb.JobRequestResponse, len(list))
	for i, r := range list {
		items[i] = protoJobRequestResponse(r)
	}

	return &jobrequestpb.ListJobRequestResponsesResponse{
		Responses: items,
	}, nil
}

// ── GetJobRequestResponse ─────────────────────────────────────────────────────

func (a *Adapter) GetJobRequestResponse(ctx context.Context, req *jobrequestpb.GetJobRequestResponseRequest) (*jobrequestpb.GetJobRequestResponseResponse, error) {
	resp, err := a.api.GetJobRequestResponse(ctx, req.JobRequestId, req.ResponseId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &jobrequestpb.GetJobRequestResponseResponse{
		Response: protoJobRequestResponse(resp),
	}, nil
}

// ── AcceptJobRequestResponse ──────────────────────────────────────────────────

func (a *Adapter) AcceptJobRequestResponse(ctx context.Context, req *jobrequestpb.AcceptJobRequestResponseRequest) (*jobrequestpb.AcceptJobRequestResponseResponse, error) {
	callerID, err := getCallerID(ctx)
	if err != nil {
		return nil, err
	}

	jr, orderID, err := a.api.AcceptJobRequestResponse(
		ctx,
		req.JobRequestId,
		req.ResponseId,
		callerID,
		req.Street,
		req.City,
		req.Region,
		req.Latitude,
		req.Longitude,
		req.ScheduledAt,
	)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &jobrequestpb.AcceptJobRequestResponseResponse{
		JobRequest: protoJobRequest(jr),
		OrderId:    orderID,
	}, nil
}

// ── WithdrawJobRequestResponse ────────────────────────────────────────────────

func (a *Adapter) WithdrawJobRequestResponse(ctx context.Context, req *jobrequestpb.WithdrawJobRequestResponseRequest) (*jobrequestpb.WithdrawJobRequestResponseResponse, error) {
	callerID, err := getCallerID(ctx)
	if err != nil {
		return nil, err
	}

	if err := a.api.WithdrawJobRequestResponse(ctx, req.JobRequestId, req.ResponseId, callerID); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &jobrequestpb.WithdrawJobRequestResponseResponse{Success: true}, nil
}

func (a *Adapter) GetAnalytics(ctx context.Context, req *jobrequestpb.GetAnalyticsRequest) (*jobrequestpb.GetAnalyticsResponse, error) {
	analytics, err := a.api.GetJobRequestAnalytics(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return protoJobRequestAnalytics(*analytics), nil
}

func protoJobRequestAnalytics(a domain.JobRequestAnalytics) *jobrequestpb.GetAnalyticsResponse {
	return &jobrequestpb.GetAnalyticsResponse{
		TotalJobRequests:     a.TotalJobRequests,
		JobRequestsThisMonth: a.JobRequestsThisMonth,
		OpenJobRequests:      a.OpenJobRequests,
		ClosedJobRequests:    a.ClosedJobRequests,
		CancelledJobRequests: a.CancelledJobRequests,
		TotalResponses:       a.TotalResponses,
		ResponsesThisMonth:   a.ResponsesThisMonth,
	}
}
