package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DSN                 string
	StripeSecretKey     string
	StripeWebhookSecret string
	OrderServiceURL     string
	JWTSecret           string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("config: no .env file, reading from environment")
	}

	return &Config{
		DSN:                 mustGet("PAYMENT_DB_DSN"),
		StripeSecretKey:     mustGet("STRIPE_SECRET_KEY"),
		StripeWebhookSecret: mustGet("STRIPE_WEBHOOK_SECRET"),
		OrderServiceURL:     mustGet("ORDER_SERVICE_URL"),
		JWTSecret:           mustGet("JWT_SECRET"),
	}
}

func mustGet(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("config: %s is required", key)
	}
	return v
}

func mustGetInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		log.Fatalf("config: %s must be an integer: %v", key, err)
	}
	return n
}
