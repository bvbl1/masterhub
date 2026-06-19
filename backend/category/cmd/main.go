package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/category/config"
	"github.com/Rask1lll/masterhub/backend/category/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/category/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/category/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("category service failed to connect to database. Error: %v", err)
	}

	application := api.NewApplication(dbAdapter)
	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPOrt())
	grpcAdapter.Run()
}
