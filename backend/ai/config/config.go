package config

import "os"

type Config struct {
	Port      string
	AIEnabled bool

	OpenRouterKey   string
	OpenRouterModel string
}

func Load() *Config {
	return &Config{
		Port:      getEnv("AI_SERVICE_PORT", "50070"),
		AIEnabled: getEnv("AI_ENABLED", "false") == "true",

		OpenRouterKey:   os.Getenv("OPENROUTER_API_KEY"),
		OpenRouterModel: getEnv("OPENROUTER_MODEL", "openrouter/free"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
