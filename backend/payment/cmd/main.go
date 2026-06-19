// cmd/main.go
package main

import (
	"log"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/Rask1lll/masterhub/backend/payment/config"
	dbAdapter "github.com/Rask1lll/masterhub/backend/payment/internal/adapters/db"
	grpcAdapter "github.com/Rask1lll/masterhub/backend/payment/internal/adapters/grpc"
	httpAdapter "github.com/Rask1lll/masterhub/backend/payment/internal/adapters/http"
	orderAdapter "github.com/Rask1lll/masterhub/backend/payment/internal/adapters/order"
	"github.com/Rask1lll/masterhub/backend/payment/internal/application/core/api"
	paymentpb "github.com/bvbl1/masterhub-proto/golang/payment"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	cfg := config.Load()

	db, err := dbAdapter.NewAdapter(cfg.DSN)
	if err != nil {
		log.Fatalf("payment-service: db init failed: %v", err)
	}

	orderClient, err := orderAdapter.NewAdapter(cfg.OrderServiceURL)
	if err != nil {
		log.Fatalf("payment-service: order client init failed: %v", err)
	}

	app := api.NewApplication(db, orderClient, cfg.StripeSecretKey)

	// gRPC сервер
	grpcServer := grpc.NewServer(grpc.UnaryInterceptor(grpcAdapter.AuthInterceptor(cfg.JWTSecret)))
	paymentpb.RegisterPaymentServiceServer(grpcServer, grpcAdapter.NewGRPCServer(app))
	reflection.Register(grpcServer)

	// HTTP mux для webhook
	mux := http.NewServeMux()
	webhookHandler := httpAdapter.NewWebhookAdapter(app, cfg.StripeWebhookSecret)
	mux.HandleFunc("/v1/payments/webhook", webhookHandler.HandleWebhook)

	// Один порт — роутим: gRPC запросы идут в grpcServer, остальное в mux.
	// h2c — это HTTP/2 без TLS (Railway терминирует TLS сам).
	combinedHandler := h2c.NewHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.ProtoMajor == 2 && strings.Contains(r.Header.Get("Content-Type"), "application/grpc") {
			grpcServer.ServeHTTP(w, r)
		} else {
			mux.ServeHTTP(w, r)
		}
	}), &http2.Server{})

	port := os.Getenv("PORT") // Railway сам выставляет PORT
	if port == "" {
		port = "8080"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("payment-service: listen failed: %v", err)
	}

	log.Printf("payment-service: listening on :%s (gRPC + webhook)", port)
	if err := http.Serve(lis, combinedHandler); err != nil {
		log.Fatalf("payment-service: serve failed: %v", err)
	}
}
