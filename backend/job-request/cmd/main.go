package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/job-request/config"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/adapters/notification"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/adapters/order"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/adapters/user"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("job request failed to connect to database. Error: %v", err)
	}

	notificationAdapter, err := notification.NewAdapter(config.GetNotificationServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to notification service. Error: %v", err)
	}
	userAdapter, err := user.NewAdapter(config.GetUserServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to user service. Error: %v", err)
	}
	orderAdapter, err := order.NewAdapter(config.GetOrderServiceUrl())
	if err != nil {
		log.Fatalf("order failed to connect to order service. Error: %v", err)
	}

	application := api.NewApplication(dbAdapter, userAdapter, notificationAdapter, orderAdapter)
	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPort())
	grpcAdapter.Run()
}
