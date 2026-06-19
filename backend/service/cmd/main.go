package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/service/config"
	categoryservice "github.com/Rask1lll/masterhub/backend/service/internal/adapters/category"
	"github.com/Rask1lll/masterhub/backend/service/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/service/internal/adapters/grpc"
	userservice "github.com/Rask1lll/masterhub/backend/service/internal/adapters/userService"
	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("service failed to connect to database. Error: %v", err)
	}

	userAdapter, err := userservice.NewAdapter(config.GetUserServiceUrl())
	if err != nil {
		log.Fatalf("service failed to connect to user service. Error: %v", err)
	}

	CategoryAdapter, err := categoryservice.NewAdapter(config.GetCategoryServiceUrl())
	if err != nil {
		log.Fatalf("service failed to connect to category service. Error: %v", err)
	}

	application := api.NewApplication(dbAdapter, userAdapter, CategoryAdapter)
	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPOrt())
	grpcAdapter.Run()
}
