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

func GetApplicationPOrt() int {
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

// ws
func GetWebSocketPort() int {
	portStr := getEnviromentValue("WEBSOCKET_PORT")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		log.Fatalf("WEBSOCKET_PORT: %s is invalid", portStr)
	}
	return port
}

// GetPort returns the public HTTP port Railway exposes.
// Railway injects PORT automatically; WEBSOCKET_PORT is a fallback for local dev.
func GetPort() int {
	// Railway injects this; always prefer it
	if p := os.Getenv("PORT"); p != "" {
		port, err := strconv.Atoi(p)
		if err != nil {
			log.Fatalf("PORT env var is not a valid int: %s", p)
		}
		return port
	}
	// local dev fallback
	return GetWebSocketPort()
}
