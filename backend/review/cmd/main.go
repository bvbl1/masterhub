package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/review/config"
	"github.com/Rask1lll/masterhub/backend/review/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/review/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/review/internal/adapters/notification"
	"github.com/Rask1lll/masterhub/backend/review/internal/adapters/order"
	"github.com/Rask1lll/masterhub/backend/review/internal/adapters/user"
	"github.com/Rask1lll/masterhub/backend/review/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("review service failed to connect to database. Error: %v", err)
	}
	userAdapter, err := user.NewAdapter(config.GetUserServiceUrl())
	if err != nil {
		log.Fatalf("review failed to connect to user service. Error: %v", err)
	}

	notificationAdapter, err := notification.NewAdapter(config.GetNotificationServiceUrl())
	if err != nil {
		log.Fatalf("review failed to connect to notification service. Error: %v", err)
	}

	orderAdapter, err := order.NewAdapter(config.GetOrderServiceUrl())
	if err != nil {
		log.Fatalf("review failed to connect to order service. Error: %v", err)
	}

	application := api.NewApplication(dbAdapter, orderAdapter, userAdapter, notificationAdapter)
	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPOrt())
	grpcAdapter.Run()
}
