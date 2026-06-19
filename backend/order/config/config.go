package config

import (
	"log"
	"os"
	"strconv"
	"time"
)

func GetEnv() string {
	return getEnviromentValue("ENV")
}

func GetDataSourceUrl() string {
	return getEnviromentValue("DATA_SOURCE_URL")
}

func GetApplicationPort() int {
	portStr := getEnviromentValue("APPLICATION_PORT")
	port, err := strconv.Atoi(portStr)

	if err != nil {
		log.Fatalf("port: %s is invalid", portStr)
	}

	return port
}

func getEnviromentValue(key string) string {
	if os.Getenv(key) == "" {
		log.Fatalf("%s environment variable is missing.", key)
	}
	return os.Getenv(key)
}

// jwt
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

// services
func GetUserServiceUrl() string {
	return getEnviromentValue("USER_SERVICE_URL")
}

func GetServiceServiceUrl() string {
	return getEnviromentValue("SERVICE_SERVICE_URL")
}

func GetLocationServiceUrl() string {
	return getEnviromentValue("LOCATION_SERVICE_URL")
}

func GetNotificationServiceUrl() string {
	return getEnviromentValue("NOTIFICATION_SERVICE_URL")
}

func GetPaymentServiceUrl() string {
	return getEnviromentValue("PAYMENT_SERVICE_URL")
}
