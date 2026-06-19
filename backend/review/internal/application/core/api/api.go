package api

import (
	"context"
	"fmt"
	"log"

	"github.com/Rask1lll/masterhub/backend/review/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/review/internal/ports"
	"google.golang.org/grpc/metadata"
)

type Application struct {
	db                 ports.DBPort
	orderClient        ports.OrderPort
	userClient         ports.UserPort
	notificationClient ports.NotificationPort
}

func NewApplication(db ports.DBPort,
	orderClient ports.OrderPort,
	userClient ports.UserPort,
	notificationClient ports.NotificationPort,
) *Application {
	return &Application{
		db:                 db,
		orderClient:        orderClient,
		userClient:         userClient,
		notificationClient: notificationClient,
	}
}

func (a *Application) sendReviewNotificationAsync(ctx context.Context, providerID int64, rating int) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		log.Printf("[review] cannot send notification: missing metadata in context")
		return
	}

	bgCtx := metadata.NewIncomingContext(context.Background(), md)

	go func() {
		providerResp, err := a.userClient.GetUserByID(bgCtx, providerID)
		if err != nil {
			log.Printf("[review] failed to fetch provider %d for notification: %v", providerID, err)
			return
		}

		a.sendNotification(bgCtx, ports.SendNotificationRequest{
			UserID: providerID,
			Email:  providerResp.Email,
			Title:  "You received a new review",
			Body:   fmt.Sprintf("A customer rated your service %d/5", rating),
			Type:   "review",
		})
	}()
}

func (a *Application) sendNotification(ctx context.Context, req ports.SendNotificationRequest) {
	if err := a.notificationClient.SendNotification(ctx, req); err != nil {
		log.Printf("[review] failed to send %s to user %d: %v", req.Type, req.UserID, err)
	}
}

func (a *Application) LeaveReview(ctx context.Context, orderId int64, rating int, comment string, photoURLs []string) (domain.Review, error) {
	reviewerId, err := extractUserIdFromCtx(ctx)
	if err != nil {
		return domain.Review{}, fmt.Errorf("unauthenticated: %w", err)
	}

	orderResp, err := a.orderClient.GetOrderById(ctx, orderId)
	if err != nil {
		return domain.Review{}, fmt.Errorf("failed to fetch order: %w", err)
	}
	if orderResp.Status != "completed" {
		return domain.Review{}, fmt.Errorf("order is not completed, current status: %s", orderResp.Status)
	}

	if orderResp.CustomerId != reviewerId {
		return domain.Review{}, fmt.Errorf("only the customer who placed the order can leave a review")
	}

	_, err = a.userClient.GetUserByID(ctx, reviewerId)
	if err != nil {
		return domain.Review{}, fmt.Errorf("reviewer not found: %w", err)
	}

	if rating < 1 || rating > 5 {
		return domain.Review{}, fmt.Errorf("rating must be between 1 and 5")
	}

	review := domain.Review{
		OrderId:    orderId,
		ServiceId:  orderResp.ServiceId,
		ReviewerId: reviewerId,
		ProviderId: orderResp.ProviderId,
		Rating:     rating,
		Comment:    comment,
		PhotoURLs:  photoURLs,
	}

	created, err := a.db.Create(ctx, review)
	if err != nil {
		return domain.Review{}, fmt.Errorf("failed to save review: %w", err)
	}

	err = a.orderClient.ChangeOrderStatus(ctx, orderId, "reviewed")
	if err != nil {
		return domain.Review{}, fmt.Errorf("failed to update order status: %w", err)
	}

	a.sendReviewNotificationAsync(ctx, orderResp.ProviderId, rating)

	return created, nil
}

func (a *Application) GetReview(ctx context.Context, reviewId int64) (domain.Review, error) {
	review, err := a.db.Get(ctx, reviewId)
	if err != nil {
		return domain.Review{}, fmt.Errorf("review not found: %w", err)
	}
	return review, nil
}

func (a *Application) ListReviewsByService(ctx context.Context, serviceId int64, limit, offset int32) ([]domain.Review, float64, error) {
	reviews, avg, err := a.db.ListByService(ctx, serviceId, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list reviews by service: %w", err)
	}
	return reviews, avg, nil
}

func (a *Application) ListReviewsByProvider(ctx context.Context, providerId int64, limit, offset int32) ([]domain.Review, float64, error) {
	reviews, avg, err := a.db.ListByProvider(ctx, providerId, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list reviews by provider: %w", err)
	}
	return reviews, avg, nil
}

func (a *Application) IsReviewLeft(ctx context.Context, orderId int64) (bool, error) {
	userId, err := extractUserIdFromCtx(ctx)
	if err != nil {
		return false, fmt.Errorf("unauthenticated: %w", err)
	}
	return a.db.IsReviewLeft(userId, orderId)
}

func (a *Application) ListReviews(ctx context.Context, limit, offset int32) ([]domain.Review, float64, error) {
	reviews, avg, err := a.db.List(ctx, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list reviews: %w", err)
	}
	return reviews, avg, nil
}

// extractUserIdFromCtx pulls the user_id that auth_interceptor stored in the context.
// Use the same key your other services use — e.g. user-service's auth_interceptor.
func extractUserIdFromCtx(ctx context.Context) (int64, error) {
	userId, ok := ctx.Value("user_id").(int64)
	if !ok || userId == 0 {
		return 0, fmt.Errorf("user_id not found in context")
	}
	return userId, nil
}
