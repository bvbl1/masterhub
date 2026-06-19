package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/notification/config"
	"github.com/Rask1lll/masterhub/backend/notification/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/notification/internal/adapters/email"
	"github.com/Rask1lll/masterhub/backend/notification/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/notification/internal/adapters/telegram"
	"github.com/Rask1lll/masterhub/backend/notification/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("failed to connect to database. Error: %v", err)
	}

	emailAdapter, err := email.NewSender(
		config.GetResendAPIKey(),
		config.GetEmailFrom(),
	)
	if err != nil {
		log.Fatalf("failed to initialize email adapter: %v", err)
	}

	telegramAdapter := telegram.NewSender(config.GetTelegramBotToken())

	application := api.NewApplication(dbAdapter, emailAdapter, telegramAdapter)

	grpcAdapter := grpc.NewAdapter(application, config.GetApplicationPOrt())

	grpcAdapter.Run()
}
