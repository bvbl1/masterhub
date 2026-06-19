package main

import (
	"log"

	"github.com/Rask1lll/masterhub/backend/user/config"
	"github.com/Rask1lll/masterhub/backend/user/internal/adapters/db"
	"github.com/Rask1lll/masterhub/backend/user/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/user/internal/application/core/api"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("failed to connect to database. Error: %v", err)
	}

	oauthConfig := &oauth2.Config{
		ClientID:     config.GetOauthGoogleClientId(),
		ClientSecret: config.GetOauthGoogleClientSecret(),
		RedirectURL:  config.GetGoogleRedirectURL(),
		Scopes: []string{
			"openid",
			"email",
			"profile",
		},
		Endpoint: google.Endpoint,
	}

	applcation := api.NewApplication(dbAdapter, config.GetJWTSecret(), config.GetJWTExpiration(), oauthConfig)
	gprcAdapter := grpc.NewAdapter(applcation, config.GetApplicationPOrt())
	gprcAdapter.Run()
}
