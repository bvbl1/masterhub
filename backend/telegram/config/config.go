package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	TelegramBotToken       string
	UserServiceURL         string
	NotificationServiceURL string
	JobRequestServiceURL   string // ← добавь
	FrontendBaseURL        string
	AIEnabled              bool
	GeminiAPIKey           string
}

func Load() *Config {
	aiEnabled, _ := strconv.ParseBool(getEnv("AI_ENABLED", "true"))
	return &Config{
		TelegramBotToken:       mustGetEnv("TELEGRAM_BOT_TOKEN"),
		UserServiceURL:         getEnv("USER_SERVICE_URL", "user-service:50051"),
		NotificationServiceURL: getEnv("NOTIFICATION_SERVICE_URL", "notification-service:50056"),
		JobRequestServiceURL:   getEnv("JOB_REQUEST_SERVICE_URL", "job-request-service:50061"), // ← добавь
		FrontendBaseURL:        getEnv("FRONTEND_BASE_URL", "http://localhost:3000"),
		AIEnabled:              aiEnabled,
		GeminiAPIKey:           os.Getenv("GEMINI_API_KEY"),
	}
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set", key)
	}
	return v
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func loadEnv() error {
	return nil // godotenv.Load() вызывается в main.go
}
