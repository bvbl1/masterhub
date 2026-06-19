package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/media/config"
	"github.com/Rask1lll/masterhub/backend/media/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/media/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/media/internal/adapters/s3"
	"github.com/Rask1lll/masterhub/backend/media/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("failed to connect to database. Error: %v", err)
	}

	s3Vars := config.GetS3Config()
	s3Adapter, err := s3.NewAdapter(
		s3Vars.Endpoint,
		s3Vars.AccessKey,
		s3Vars.SecretKey,
		s3Vars.Region,
		s3Vars.Bucket,
		s3Vars.PublicHost,
	)
	if err != nil {
		log.Fatalf("failed to connect to S3. Error: %v", err)
	}

	application := api.NewApplication(dbAdapter, s3Adapter)

	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPort())
	grpcAdapter.Run()
}
