package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/location/config"
	"github.com/Rask1lll/masterhub/backend/location/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/location/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/location/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("service failed to connect to database. Error: %v", err)
	}

	application := api.NewApplication(dbAdapter)
	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPOrt())
	grpcAdapter.Run()
}
