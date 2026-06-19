package api

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/Rask1lll/masterhub/backend/job-request/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/ports"
)

type Application struct {
	db                  ports.DBPort
	userService         ports.UserPort
	notificationService ports.NotificationPort
	orderService        ports.OrderPort
}

func NewApplication(
	db ports.DBPort,
	userService ports.UserPort,
	notificationService ports.NotificationPort,
	orderService ports.OrderPort,
) *Application {
	return &Application{
		db:                  db,
		userService:         userService,
		notificationService: notificationService,
		orderService:        orderService,
	}
}

func (a *Application) sendNotification(ctx context.Context, req ports.SendNotificationRequest) {
	if err := a.notificationService.SendNotification(ctx, req); err != nil {
		log.Printf("[Notification] failed to send %s to user %d: %v", req.Type, req.UserID, err)
	}
}

// Job Request

func (a *Application) CreateJobRequest(ctx context.Context, categoryID int64, title, description, city string, budgetMin, budgetMax float64, scheduledAt string, photoUrls []string) (domain.JobRequest, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.JobRequest{}, fmt.Errorf("unauthenticated")
	}

	caller, err := a.userService.GetUserByID(ctx, callerID)
	if err != nil {
		return domain.JobRequest{}, fmt.Errorf("user not found: %w", err)
	}
	if caller.Role != "customer" {
		return domain.JobRequest{}, fmt.Errorf("only customers can create job requests")
	}

	scheduledTime, err := time.Parse(time.RFC3339, scheduledAt)
	if err != nil {
		return domain.JobRequest{}, fmt.Errorf("scheduled_at must be a valid RFC3339 timestamp")
	}

	jobReq, err := a.db.SaveJobRequest(ctx, domain.JobRequest{
		CustomerID:  callerID,
		CategoryID:  categoryID,
		Title:       title,
		Description: description,
		City:        city,
		BudgetMin:   budgetMin,
		BudgetMax:   budgetMax,
		ScheduledAt: scheduledTime,
		Status:      domain.StatusOpen,
		PhotoUrls:   photoUrls,
	})
	if err != nil {
		return domain.JobRequest{}, fmt.Errorf("failed to save job request: %w", err)
	}
	return jobReq, nil
}

func (a *Application) GetJobRequest(ctx context.Context, id int64) (domain.JobRequest, error) {
	jr, err := a.db.GetJobRequestByID(ctx, id)
	if err != nil {
		return domain.JobRequest{}, fmt.Errorf("job request not found: %w", err)
	}
	return jr, nil
}

func (a *Application) ListJobRequests(ctx context.Context, jobStatus string, categoryID int64, city string, limit, offset int32) ([]domain.JobRequest, error) {
	list, err := a.db.ListJobRequests(ctx, jobStatus, categoryID, city, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list job requests: %w", err)
	}
	return list, nil
}

func (a *Application) CancelJobRequest(ctx context.Context, id, customerID int64) error {
	jr, err := a.db.GetJobRequestByID(ctx, id)
	if err != nil {
		return fmt.Errorf("job request not found: %w", err)
	}

	if jr.CustomerID != customerID {
		return fmt.Errorf("only the customer who created this request can cancel it")
	}

	if !jr.CanTransitionTo(domain.StatusCancelled) {
		return fmt.Errorf("cannot cancel job request in status %q", jr.Status)
	}

	if err := a.db.UpdateJobRequestStatus(ctx, id, domain.StatusCancelled); err != nil {
		return fmt.Errorf("failed to cancel job request: %w", err)
	}
	return nil
}

//Job Request Response (provider bids)

func (a *Application) RespondToJobRequest(ctx context.Context, jobRequestID, providerID int64, proposedPrice float64, comment string, estimatedDays int32) (domain.JobRequestResponse, error) {
	// verify provider role
	provider, err := a.userService.GetUserByID(ctx, providerID)
	if err != nil {
		return domain.JobRequestResponse{}, fmt.Errorf("provider not found: %w", err)
	}
	if provider.Role != "provider" {
		return domain.JobRequestResponse{}, fmt.Errorf("only providers can respond to job requests")
	}

	// verify job request exists and is open
	jr, err := a.db.GetJobRequestByID(ctx, jobRequestID)
	if err != nil {
		return domain.JobRequestResponse{}, fmt.Errorf("job request not found: %w", err)
	}
	if jr.Status != domain.StatusOpen {
		return domain.JobRequestResponse{}, fmt.Errorf("cannot respond to job request in status %q", jr.Status)
	}

	resp, err := a.db.SaveJobRequestResponse(ctx, domain.JobRequestResponse{
		JobRequestID:  jobRequestID,
		ProviderID:    providerID,
		ProposedPrice: proposedPrice,
		Comment:       comment,
		EstimatedDays: estimatedDays,
		Status:        domain.StatusPending,
	})
	if err != nil {
		return domain.JobRequestResponse{}, fmt.Errorf("failed to save response: %w", err)
	}

	// increment response counter — non-fatal
	if err := a.db.IncrementResponseCount(ctx, jobRequestID); err != nil {
		log.Printf("[JobRequest] failed to increment response count for job request %d: %v", jobRequestID, err)
	}

	// notify the customer that a new bid arrived
	customer, err := a.userService.GetUserByID(ctx, jr.CustomerID)
	if err == nil {
		a.sendNotification(ctx, ports.SendNotificationRequest{
			UserID: customer.ID,
			Title:  "New Bid on Your Request",
			Body:   "A provider has placed a bid on your job request #" + strconv.FormatInt(jobRequestID, 10),
			Type:   "new_bid",
			Email:  customer.Email,
		})
	}

	return resp, nil
}

func (a *Application) ListJobRequestResponses(ctx context.Context, jobRequestID, customerID int64, limit, offset int32) ([]domain.JobRequestResponse, error) {
	jr, err := a.db.GetJobRequestByID(ctx, jobRequestID)
	if err != nil {
		return nil, fmt.Errorf("job request not found: %w", err)
	}

	if jr.CustomerID != customerID {
		return nil, fmt.Errorf("only the owning customer can view responses")
	}

	list, err := a.db.ListJobRequestResponses(ctx, jobRequestID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list responses: %w", err)
	}
	return list, nil
}

func (a *Application) GetJobRequestResponse(ctx context.Context, jobRequestID, responseID int64) (domain.JobRequestResponse, error) {
	resp, err := a.db.GetJobRequestResponseByID(ctx, responseID)
	if err != nil {
		return domain.JobRequestResponse{}, fmt.Errorf("response not found: %w", err)
	}

	// make sure the response belongs to the given job request
	if resp.JobRequestID != jobRequestID {
		return domain.JobRequestResponse{}, fmt.Errorf("response %d does not belong to job request %d", responseID, jobRequestID)
	}

	return resp, nil
}

func (a *Application) AcceptJobRequestResponse(ctx context.Context, jobRequestID, responseID, customerID int64, street, city, region string, latitude, longitude float64, scheduledAt string) (domain.JobRequest, int64, error) {
	// validate scheduledAt is proper RFC3339 before forwarding to order-service
	parsedTime, err := time.Parse(time.RFC3339, scheduledAt)
	if err != nil {
		return domain.JobRequest{}, 0, fmt.Errorf("scheduled_at must be a valid RFC3339 timestamp")
	}
	// re-format to guarantee clean RFC3339 output regardless of what client sent
	scheduledAt = parsedTime.Format(time.RFC3339)
	log.Printf("DEBUG scheduledAt received: %q", scheduledAt)
	// 1. verify job request ownership and status
	jr, err := a.db.GetJobRequestByID(ctx, jobRequestID)
	if err != nil {
		return domain.JobRequest{}, 0, fmt.Errorf("job request not found: %w", err)
	}
	if jr.CustomerID != customerID {
		return domain.JobRequest{}, 0, fmt.Errorf("only the owning customer can accept a response")
	}
	if !jr.CanTransitionTo(domain.StatusClosed) {
		return domain.JobRequest{}, 0, fmt.Errorf("cannot accept a response on job request in status %q", jr.Status)
	}

	// 2. verify the chosen response exists and belongs to this job request
	resp, err := a.db.GetJobRequestResponseByID(ctx, responseID)
	if err != nil {
		return domain.JobRequest{}, 0, fmt.Errorf("response not found: %w", err)
	}
	if resp.JobRequestID != jobRequestID {
		return domain.JobRequest{}, 0, fmt.Errorf("response %d does not belong to job request %d", responseID, jobRequestID)
	}
	if !resp.CanTransitionTo(domain.StatusAccepted) {
		return domain.JobRequest{}, 0, fmt.Errorf("cannot accept response in status %q", resp.Status)
	}

	// 3. mark chosen response as accepted
	if err := a.db.UpdateJobRequestResponseStatus(ctx, responseID, domain.StatusAccepted); err != nil {
		return domain.JobRequest{}, 0, fmt.Errorf("failed to accept response: %w", err)
	}

	// 4. reject all other pending responses
	if err := a.db.RejectAllOtherResponses(ctx, jobRequestID, responseID); err != nil {
		return domain.JobRequest{}, 0, fmt.Errorf("failed to reject other responses: %w", err)
	}

	// 5. close the job request
	if err := a.db.UpdateJobRequestStatus(ctx, jobRequestID, domain.StatusClosed); err != nil {
		return domain.JobRequest{}, 0, fmt.Errorf("failed to close job request: %w", err)
	}

	// 6. call order-service to create the order
	// ctx carries the customer's JWT so order-service extracts customer_id from it automatically
	orderResp, err := a.orderService.CreateOrder(ctx, ports.CreateOrderRequest{
		ServiceID:   0, // Flow 2 — no service listing
		ProviderID:  resp.ProviderID,
		Street:      street,
		City:        city,
		Region:      region,
		Latitude:    latitude,
		Longitude:   longitude,
		ScheduledAt: scheduledAt,
		AgreedPrice: resp.ProposedPrice,
	})
	if err != nil {
		return domain.JobRequest{}, 0, fmt.Errorf("failed to create order: %w", err)
	}

	// 7. notify the accepted provider
	provider, err := a.userService.GetUserByID(ctx, resp.ProviderID)
	if err == nil {
		a.sendNotification(ctx, ports.SendNotificationRequest{
			UserID: provider.ID,
			Title:  "Your Bid Was Accepted",
			Body:   "The customer has accepted your bid on job request #" + strconv.FormatInt(jobRequestID, 10) + ". Order #" + strconv.FormatInt(orderResp.OrderID, 10) + " has been created.",
			Type:   "bid_accepted",
			Email:  provider.Email,
		})
	}

	jr.Status = domain.StatusClosed
	return jr, orderResp.OrderID, nil
}

func (a *Application) WithdrawJobRequestResponse(ctx context.Context, jobRequestID, responseID, providerID int64) error {
	resp, err := a.db.GetJobRequestResponseByID(ctx, responseID)
	if err != nil {
		return fmt.Errorf("response not found: %w", err)
	}

	if resp.JobRequestID != jobRequestID {
		return fmt.Errorf("response %d does not belong to job request %d", responseID, jobRequestID)
	}

	if resp.ProviderID != providerID {
		return fmt.Errorf("only the provider who placed this bid can withdraw it")
	}

	if !resp.CanTransitionTo(domain.StatusWithdrawn) {
		return fmt.Errorf("cannot withdraw response in status %q", resp.Status)
	}

	if err := a.db.UpdateJobRequestResponseStatus(ctx, responseID, domain.StatusWithdrawn); err != nil {
		return fmt.Errorf("failed to withdraw response: %w", err)
	}
	return nil
}

func (a *Application) GetJobRequestAnalytics(ctx context.Context) (*domain.JobRequestAnalytics, error) {
	userRole, ok := ctx.Value("role").(string)
	if !ok {
		return nil, fmt.Errorf("unauthenticated")
	}
	if userRole != "admin" {
		return nil, fmt.Errorf("forbidden: only admins can access analytics")
	}

	analytics, err := a.db.GetJobRequestAnalytics(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get job request analytics: %w", err)
	}
	return analytics, nil
}
