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

func getEnviromentValue(key string) string {
	if os.Getenv(key) == "" {
		log.Fatalf("%s environment variable is missing.", key)
	}
	return os.Getenv(key)
}

func GetUserServiceUrl() string {
	return getEnviromentValue("USER_SERVICE_URL")
}

func GetNotificationServiceUrl() string {
	return getEnviromentValue("NOTIFICATION_SERVICE_URL")
}

func GetOrderServiceUrl() string {
	return getEnviromentValue("ORDER_SERVICE_URL")
}
