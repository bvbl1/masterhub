package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/rs/cors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"

	"github.com/Rask1lll/masterhub/backend/gateway/config"
	categorypb "github.com/bvbl1/masterhub-proto/golang/category"
	chatpb "github.com/bvbl1/masterhub-proto/golang/chat"
	jobrequestpb "github.com/bvbl1/masterhub-proto/golang/job-request"
	locationpb "github.com/bvbl1/masterhub-proto/golang/location"
	mediapb "github.com/bvbl1/masterhub-proto/golang/media"
	notificationpb "github.com/bvbl1/masterhub-proto/golang/notification"
	orderpb "github.com/bvbl1/masterhub-proto/golang/order"
	paymentpb "github.com/bvbl1/masterhub-proto/golang/payment"
	reviewpb "github.com/bvbl1/masterhub-proto/golang/review"
	servicepb "github.com/bvbl1/masterhub-proto/golang/service"
	pb "github.com/bvbl1/masterhub-proto/golang/user"
	userpb "github.com/bvbl1/masterhub-proto/golang/user"
)

func main() {
	ctx := context.Background()

	mux := runtime.NewServeMux(
		runtime.WithOutgoingHeaderMatcher(func(key string) (string, bool) {
			// Forward Authorization header to gRPC metadata
			if key == "Authorization" {
				return key, true
			}
			return runtime.DefaultHeaderMatcher(key)
		}),
	)

	// User Service
	userConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("USER_SERVICE_URL", "user-service:50051"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to user gRPC server: %v", err)
	}
	defer userConn.Close()

	if err := pb.RegisterUserServiceHandler(ctx, mux, userConn); err != nil {
		log.Fatalf("Failed to register UserService handler: %v", err)
	}

	// Category Service
	categoryConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("CATEGORY_SERVICE_URL", "category-service:50052"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Category gRPC server: %v", err)
	}
	defer categoryConn.Close()

	if err := categorypb.RegisterCategoryServiceHandler(ctx, mux, categoryConn); err != nil {
		log.Fatalf("Failed to register CategoryService handler: %v", err)
	}

	// Service Service
	serviceConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("SERVICE_SERVICE_URL", "service-service:50053"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Service gRPC server: %v", err)
	}
	defer serviceConn.Close()

	if err := servicepb.RegisterServiceServiceHandler(ctx, mux, serviceConn); err != nil {
		log.Fatalf("Failed to register ServiceService handler: %v", err)
	}

	// Location Service
	locationConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("LOCATION_SERVICE_URL", "location-service:50054"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Location gRPC server: %v", err)
	}
	defer locationConn.Close()

	if err := locationpb.RegisterLocationServiceHandler(ctx, mux, locationConn); err != nil {
		log.Fatalf("Failed to register LocationService handler: %v", err)
	}

	// Chat Service
	chatConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("CHAT_SERVICE_URL", "chat-service:50055"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Chat gRPC server: %v", err)
	}
	defer chatConn.Close()

	if err := chatpb.RegisterChatServiceHandler(ctx, mux, chatConn); err != nil {
		log.Fatalf("Failed to register ChatService handler: %v", err)
	}

	// Notification Service
	notificationConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("NOTIFICATION_SERVICE_URL", "notification-service:50056"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Notification gRPC server: %v", err)
	}
	defer notificationConn.Close()

	if err := notificationpb.RegisterNotificationServiceHandler(ctx, mux, notificationConn); err != nil {
		log.Fatalf("Failed to register NotificationService handler: %v", err)
	}

	// Order Service
	orderConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("ORDER_SERVICE_URL", "order-service:50057"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Order gRPC server: %v", err)
	}
	defer orderConn.Close()

	if err := orderpb.RegisterOrderServiceHandler(ctx, mux, orderConn); err != nil {
		log.Fatalf("Failed to register OrderService handler: %v", err)
	}

	// Payment Service
	paymentConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("PAYMENT_SERVICE_URL", "payment-service:50058"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Payment gRPC server: %v", err)
	}
	defer paymentConn.Close()

	if err := paymentpb.RegisterPaymentServiceHandler(ctx, mux, paymentConn); err != nil {
		log.Fatalf("Failed to register PaymentService handler: %v", err)
	}

	// Review Service
	reviewConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("REVIEW_SERVICE_URL", "review-service:50059"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Review gRPC server: %v", err)
	}
	defer reviewConn.Close()

	if err := reviewpb.RegisterReviewServiceHandler(ctx, mux, reviewConn); err != nil {
		log.Fatalf("Failed to register ReviewService handler: %v", err)
	}

	// Media Service
	mediaConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("MEDIA_SERVICE_URL", "media-service:50060"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to Media gRPC server: %v", err)
	}
	defer mediaConn.Close()

	if err := mediapb.RegisterMediaServiceHandler(ctx, mux, mediaConn); err != nil {
		log.Fatalf("Failed to register MediaService handler: %v", err)
	}

	// Job Request Service
	jobRequestConn, err := grpc.DialContext(
		ctx,
		config.GetEnv("JOB_REQUEST_SERVICE_URL", "job-request-service:50061"),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to JobRequest gRPC server: %v", err)
	}
	defer jobRequestConn.Close()

	if err := jobrequestpb.RegisterJobRequestServiceHandler(ctx, mux, jobRequestConn); err != nil {
		log.Fatalf("Failed to register JobRequestService handler: %v", err)
	}

	// ─── HTTP Mux ─────────────────────────────────────────────────────────────

	httpMux := http.NewServeMux()

	// Telegram token endpoint
	httpMux.HandleFunc("/v1/users/telegram-token", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, _, err := jwt.NewParser().ParseUnverified(tokenStr, jwt.MapClaims{})
		if err != nil {
			log.Printf("JWT parse error: %v", err)
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			log.Printf("Claims cast error")
			http.Error(w, `{"error":"invalid claims"}`, http.StatusUnauthorized)
			return
		}

		log.Printf("Claims: %v", claims)

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			log.Printf("user_id not found in claims: %v", claims)
			http.Error(w, `{"error":"user_id not found"}`, http.StatusUnauthorized)
			return
		}
		userID := int64(userIDFloat)
		log.Printf("Calling GenerateTelegramToken for userID: %d", userID)

		userClient := userpb.NewUserServiceClient(userConn)
		resp, err := userClient.GenerateTelegramToken(r.Context(), &userpb.GenerateTelegramTokenRequest{
			UserId: userID,
		})
		if err != nil {
			log.Printf("GenerateTelegramToken gRPC error: %v", err)
			http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
			return
		}

		expiresAt := time.Now().Add(15 * time.Minute).UTC().Format(time.RFC3339)
		botUsername := strings.TrimPrefix(strings.TrimSpace(config.GetEnv("TELEGRAM_BOT_USERNAME", "")), "@")
		telegramURL := ""
		if botUsername != "" {
			telegramURL = fmt.Sprintf("https://t.me/%s?start=%s", botUsername, resp.Token)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"token":        resp.Token,
			"telegram_url": telegramURL,
			"expires_at":   expiresAt,
		})
	})

	//analytics endpoint
	httpMux.HandleFunc("/v1/admin/analytics", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodGet {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		md := metadata.Pairs("authorization", authHeader)
		ctx := metadata.NewOutgoingContext(r.Context(), md)

		orderClient := orderpb.NewOrderServiceClient(orderConn)
		userClient := userpb.NewUserServiceClient(userConn)
		jobReqClient := jobrequestpb.NewJobRequestServiceClient(jobRequestConn)

		orderStats, err := orderClient.GetAnalytics(ctx, &orderpb.GetAnalyticsRequest{})
		if err != nil {
			log.Printf("order analytics error: %v", err)
			http.Error(w, `{"error":"failed to get order analytics"}`, http.StatusInternalServerError)
			return
		}

		userStats, err := userClient.GetAnalytics(ctx, &userpb.GetAnalyticsRequest{})
		if err != nil {
			log.Printf("user analytics error: %v", err)
			http.Error(w, `{"error":"failed to get user analytics"}`, http.StatusInternalServerError)
			return
		}

		jobStats, err := jobReqClient.GetAnalytics(ctx, &jobrequestpb.GetAnalyticsRequest{})
		if err != nil {
			log.Printf("job-request analytics error: %v", err)
			http.Error(w, `{"error":"failed to get job-request analytics"}`, http.StatusInternalServerError)
			return
		}

		// map repeated OrderStatusCount into a plain map for cleaner JSON
		byStatus := make(map[string]int64, len(orderStats.ByStatus))
		for _, s := range orderStats.ByStatus {
			byStatus[s.Status] = s.Count
		}

		combined := map[string]any{
			"orders": map[string]any{
				"total":              orderStats.TotalOrders,
				"this_month":         orderStats.OrdersThisMonth,
				"by_status":          byStatus,
				"total_revenue":      orderStats.TotalRevenue,
				"revenue_this_month": orderStats.RevenueThisMonth,
				"avg_order_value":    orderStats.AvgOrderValue,
				"completion_rate":    orderStats.CompletionRate,
			},
			"users": map[string]any{
				"total":                userStats.TotalUsers,
				"new_this_month":       userStats.NewUsersThisMonth,
				"total_providers":      userStats.TotalProviders,
				"total_customers":      userStats.TotalCustomers,
				"pending_applications": userStats.PendingApplications,
			},
			"job_requests": map[string]any{
				"total":                jobStats.TotalJobRequests,
				"this_month":           jobStats.JobRequestsThisMonth,
				"open":                 jobStats.OpenJobRequests,
				"closed":               jobStats.ClosedJobRequests,
				"cancelled":            jobStats.CancelledJobRequests,
				"total_responses":      jobStats.TotalResponses,
				"responses_this_month": jobStats.ResponsesThisMonth,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(combined); err != nil {
			log.Printf("analytics encode error: %v", err)
		}
	})

	httpMux.HandleFunc("/v1/auth/google/exchange", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var body struct {
			Code  string `json:"code"`
			State string `json:"state"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 45*time.Second)
		defer cancel()

		userClient := userpb.NewUserServiceClient(userConn)
		resp, err := userClient.GoogleAuthCallback(ctx, &userpb.GoogleAuthCallbackRequest{
			Code:  body.Code,
			State: body.State,
		})
		if err != nil {
			http.Error(w, `{"error":"auth failed"}`, http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"token": resp.Token,
			"user":  resp.User,
		})
	})

	// Все остальные запросы — в grpc-gateway
	httpMux.Handle("/", wrapGoogleOAuthRedirect(mux, userConn))

	// CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   getAllowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(httpMux)

	log.Println("API Gateway starting on http://localhost:8080")
	log.Println("Available endpoints:")
	log.Println("  - User:     /v1/users, /v1/auth/login, etc.")
	log.Println("  - Category: /v1/categories, /v1/categories/{id}, etc.")
	log.Println("  - Service:  /v1/services, /v1/services/{id}, etc.")
	log.Println("  - Location: /v1/locations, /v1/locations/{id}, etc.")
	log.Println("  - Chat:     /v1/conversations, /v1/conversations/{id}/messages, etc.")
	log.Println("  - Telegram: POST /v1/users/telegram-token")

	port := config.GetEnv("GATEWAY_PORT", "8080")
	log.Printf("API Gateway starting on :%s", port)

	if err := http.ListenAndServe(":"+port, corsHandler); err != nil {
		log.Fatalf("Gateway failed: %v", err)
	}
}

func getAllowedOrigins() []string {
	base := []string{"http://localhost:3000", "http://localhost:3001"}
	if v := config.GetEnv("FRONTEND_BASE_URL", ""); v != "" {
		base = append(base, v)
	}
	return base
}
