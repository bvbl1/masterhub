package config

import (
	"log"
	"os"
	"strconv"
	"time"
)

// env methods
func GetEnv() string {
	return getEnviromentValue("ENV")
}

func GetDataSourceUrl() string {
	return getEnviromentValue("DATA_SOURCE_URL")
}

func GetApplicationPOrt() int {
	portStr := getEnviromentValue("APPLICATION_PORT")
	port, err := strconv.Atoi(portStr)

	if err != nil {
		log.Fatalf("port: %s is invalid", portStr)
	}

	return port
}

// JWT
func GetJWTSecret() string {
	return getEnviromentValue("JWT_SECRET")
}

func GetJWTExpiration() time.Duration {
	expStr := getEnviromentValue("JWT_EXPIRATION")

	exp, err := time.ParseDuration(expStr)
	if err != nil {
		log.Fatalf("JWT_EXPIRATION: %s is invalid", expStr)
	}
	return exp
}

// google auth
func GetOauthGoogleClientSecret() string {
	return getEnviromentValue("OAUTH_GOOGLE_CLIENT_SECRET")
}

func GetOauthGoogleClientId() string {
	return getEnviromentValue("OAUTH_GOOGLE_CLIENT_ID")
}

func GetGoogleRedirectURL() string {
	return getEnviromentValue("OAUTH_GOOGLE_REDIRECT_URL")
}

// inner
func getEnviromentValue(key string) string {
	if os.Getenv(key) == "" {
		log.Fatalf("%s environment variable is missing.", key)
	}
	return os.Getenv(key)
}
