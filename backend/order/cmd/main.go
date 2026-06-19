package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/order/config"
	"github.com/Rask1lll/masterhub/backend/order/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/order/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/order/internal/adapters/location"
	"github.com/Rask1lll/masterhub/backend/order/internal/adapters/notification"
	"github.com/Rask1lll/masterhub/backend/order/internal/adapters/payment"
	"github.com/Rask1lll/masterhub/backend/order/internal/adapters/service"
	"github.com/Rask1lll/masterhub/backend/order/internal/adapters/user"
	"github.com/Rask1lll/masterhub/backend/order/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to database. Error: %v", err)
	}

	locationAdapter, err := location.NewAdapter(config.GetLocationServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to location service. Error: %v", err)
	}
	notificationAdapter, err := notification.NewAdapter(config.GetNotificationServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to notification service. Error: %v", err)
	}
	paymentAdapter, err := payment.NewAdapter(config.GetPaymentServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to payment service. Error: %v", err)
	}
	serviceAdapter, err := service.NewAdapter(config.GetServiceServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to service service. Error: %v", err)
	}
	userAdapter, err := user.NewAdapter(config.GetUserServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to user service. Error: %v", err)
	}

	application := api.NewOrderService(dbAdapter, userAdapter, serviceAdapter, locationAdapter, notificationAdapter, paymentAdapter)
	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPort())
	grpcAdapter.Run()

}
