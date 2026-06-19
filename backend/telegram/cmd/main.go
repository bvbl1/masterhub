package main

import (
	"log"

	"github.com/joho/godotenv"

	"github.com/Rask1lll/masterhub/backend/telegram/config"
	"github.com/Rask1lll/masterhub/backend/telegram/internal/adapters/bot"
	grpcclient "github.com/Rask1lll/masterhub/backend/telegram/internal/adapters/grpc"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	clients, err := grpcclient.NewClients(
		cfg.UserServiceURL,
		cfg.NotificationServiceURL,
		cfg.JobRequestServiceURL,
	)
	if err != nil {
		log.Fatalf("failed to connect to gRPC services: %v", err)
	}

	b, err := bot.New(cfg, clients)
	if err != nil {
		log.Fatalf("failed to create bot: %v", err)
	}

	b.Run()
}
